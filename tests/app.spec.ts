import { test, expect, type Page } from "@playwright/test";
const scene = (p: Page, n: number) =>
  p.getByRole("button", { name: new RegExp(`^장면 ${n}:`) }).click();
async function layout(p: Page) {
  expect(
    await p.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
    })),
  ).toEqual(p.viewportSize());
  const overflows = await p
    .locator(
      ".scenario,.results,.evidence,.plan-preview,.sources-page,.source-detail,.ontology-canvas,.ontology-detail,.ontology-node,.foundation-end,.foundation-graph,.foundation-context",
    )
    .evaluateAll((els) =>
      els
        .filter(
          (e) =>
            e.scrollHeight > e.clientHeight + 2 ||
            e.scrollWidth > e.clientWidth + 2,
        )
        .map((e) => e.className),
    );
  expect(overflows).toEqual([]);
}
test("manual flow, filters, both explanations, plan and reset", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/?demo=logistics");
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await page
    .getByRole("button", { name: "영향 분석하기", exact: true })
    .click();
  await page.getByRole("button", { name: "추천 질문", exact: true }).click();
  await page
    .getByRole("button", { name: "영향 분석 실행", exact: true })
    .click();
  await expect(page.getByTestId("kpi-impacted")).toHaveText("38건");
  await expect(page.getByTestId("kpi-reroutable")).toHaveText("26건");
  await expect(page.getByTestId("kpi-risk")).toHaveText("12건");
  await page.getByRole("button", { name: "LM-1001", exact: true }).click();
  await expect(page.getByTestId("evidence-verdict")).toContainText(
    "가용 26개 중 이 주문 1개 배정 가능",
  );
  await page
    .getByRole("button", { name: "우선 대응 필요 12건", exact: true })
    .click();
  await expect(page.getByTestId("list-count")).toHaveText("1–6 / 12건");
  await page.getByRole("button", { name: "LM-1027", exact: true }).click();
  await expect(page.getByTestId("evidence-verdict")).toContainText(
    "SKU_B · 서울 가용 0개 · 배정 0개",
  );
  await page
    .getByRole("button", { name: "대응안 시뮬레이션", exact: true })
    .click();
  await expect(page.getByTestId("plan-preview")).toContainText(
    "26건 대체 출고 제안",
  );
  await expect(
    page.getByRole("img", {
      name: "조치 전 38건, 계획 적용 후 잔여 위험 12건. 동일한 영향 주문 기준.",
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "대체 출고 대상 보기", exact: true })
    .click();
  await expect(page.getByTestId("list-count")).toHaveText("1–6 / 26건");
  await page
    .getByRole("button", { name: "계획 비교 보기", exact: true })
    .click();
  await page
    .getByTestId("plan-preview")
    .getByRole("button", { name: "시뮬레이션 해제", exact: true })
    .click();
  await expect(page.getByTestId("plan-preview")).toHaveCount(0);
  await expect(page.getByTestId("kpi-impacted")).toHaveText("38건");
  await page
    .getByRole("button", { name: "영향 주문 38건", exact: true })
    .click();
  for (let i = 0; i < 6; i++)
    await page.getByRole("button", { name: "다음 주문 페이지" }).click();
  await expect(page.getByTestId("list-count")).toHaveText("37–38 / 38건");
  await expect(
    page.getByRole("button", { name: "다음 주문 페이지" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "리셋", exact: true }).click();
  await expect(page.getByLabel("운영 질문", { exact: true })).toHaveValue("");
  expect(errors).toEqual([]);
});
test("unsupported input, keyboard, dialogs and read-only support pages", async ({
  page,
}) => {
  await page.goto("/?demo=logistics");
  await page
    .getByLabel("운영 질문", { exact: true })
    .fill("매출을 예측해 주세요");
  await page.getByRole("button", { name: "영향 분석 실행" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "현재 데모에서는 이 시나리오를 지원합니다",
  );
  await expect(page.getByTestId("kpi-impacted")).toHaveText("—");
  await page.getByLabel("운영 질문", { exact: true }).press("r");
  await expect(page.getByTestId("app")).toHaveAttribute(
    "data-playing",
    "false",
  );
  await page.getByRole("button", { name: "추천 질문", exact: true }).click();
  await page.getByRole("button", { name: "가정 보기", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "가정 보기", exact: true }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "Ontology Explorer", exact: true })
    .click();
  for (const c of [
    "Warehouse",
    "Inventory",
    "Product",
    "OrderItem",
    "Order",
    "Shipment",
  ]) {
    await page
      .locator(".ontology-node")
      .filter({ has: page.getByText(c, { exact: true }) })
      .click();
    await expect(page.locator(".ontology-detail h2")).toHaveText(c);
  }
  await page.getByRole("button", { name: "Data Sources", exact: true }).click();
  await expect(page.getByText("DEMO CONNECTED", { exact: true })).toHaveCount(
    4,
  );
  await page.getByRole("button", { name: "관계 보기" }).first().click();
  await expect(page.locator("h1")).toHaveText("Ontology Explorer");
});
for (const size of [
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 1710, height: 1107 },
  { width: 1710, height: 924 },
])
  test(`layout ${size.width}x${size.height}`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto("/?demo=logistics");
    for (const n of [1, 2, 3, 4, 5, 6]) {
      await scene(page, n);
      if (n === 4)
        await page
          .getByRole("button", { name: "LM-1001", exact: true })
          .click();
      await page.waitForTimeout(350);
      await layout(page);
      await expect(
        page.getByText("DEMO · SIMULATED DATA", { exact: true }),
      ).toBeVisible();
      if (n === 4 || n === 5)
        await page.screenshot({
          path: `test-results/${size.width}x${size.height}-scene-${n}.png`,
        });
    }
    for (const name of ["Overview", "Ontology Explorer", "Data Sources"]) {
      await page.getByRole("button", { name, exact: true }).click();
      await layout(page);
      // Support views must also fit above the recording controls.
      const overlap = await page.evaluate(() => {
        const dock = document
          .querySelector(".demo-dock")!
          .getBoundingClientRect();
        return Array.from(
          document.querySelectorAll(
            ".source-detail,.source-notice,.ontology-node,.ontology-note",
          ),
        ).some((element) => element.getBoundingClientRect().bottom > dock.top);
      });
      expect(overlap).toBe(false);
      await page.screenshot({
        path: `test-results/${size.width}x${size.height}-${name.replaceAll(" ", "-")}.png`,
      });
    }
  });
test("small screen has no horizontal overflow and keeps controls reachable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?demo=logistics");
  await scene(page, 5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await expect(page.getByTestId("plan-preview")).toBeVisible();
  await page.getByRole("button", { name: "우선 대응 대상 보기" }).click();
  await expect(
    page.getByRole("button", { name: "LM-1027", exact: true }),
  ).toBeVisible();
});
test("pause, resume, seeks, stale completion cancellation, record mode and reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?demo=logistics");
  await page.getByRole("button", { name: "추천 질문", exact: true }).click();
  await page.getByRole("button", { name: "영향 분석 실행" }).click();
  await page.getByRole("button", { name: "리셋", exact: true }).click();
  await page.waitForTimeout(750);
  await expect(page.getByTestId("kpi-impacted")).toHaveText("—");
  await page
    .getByRole("button", { name: "30초 데모 시작", exact: true })
    .click();
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: "일시정지", exact: true }).click();
  const t = await page.getByTestId("timecode").innerText();
  await page.waitForTimeout(400);
  expect(await page.getByTestId("timecode").innerText()).toBe(t);
  await page.getByRole("button", { name: "재개", exact: true }).click();
  await page.waitForTimeout(200);
  expect(await page.getByTestId("timecode").innerText()).not.toBe(t);
  await page.getByRole("button", { name: "일시정지", exact: true }).click();
  for (const n of [5, 3, 6, 4]) await scene(page, n);
  await expect(page.getByTestId("kpi-impacted")).toHaveText("38건");
  await expect(page.getByTestId("plan-preview")).toHaveCount(0);
  await page.getByRole("button", { name: "녹화 모드", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "리셋", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("DEMO · SIMULATED DATA", { exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "리셋", exact: true }),
  ).toBeVisible();
});
test("three full real-time 30-second playbacks stay deterministic without external requests", async ({
  page,
}) => {
  test.setTimeout(115000);
  const external: string[] = [];
  await page.route("**/*", (route) => {
    if (new URL(route.request().url()).hostname !== "127.0.0.1") {
      external.push(route.request().url());
      return route.abort();
    }
    return route.continue();
  });
  await page.goto("/?demo=logistics");
  for (let run = 0; run < 3; run++) {
    await page.getByRole("button", { name: "리셋", exact: true }).click();
    const start = Date.now();
    await page
      .getByRole("button", { name: "30초 데모 시작", exact: true })
      .click();
    await expect(page.getByTestId("kpi-impacted")).toHaveText("38건", {
      timeout: 15000,
    });
    await expect(page.getByTestId("evidence-verdict")).toContainText(
      "가용 26개",
      { timeout: 4000 },
    );
    await expect(page.getByTestId("plan-preview")).toBeVisible({
      timeout: 6000,
    });
    await expect(page.getByTestId("app")).toHaveAttribute("data-page", "end", {
      timeout: 10000,
    });
    await expect(page.getByTestId("timecode")).toHaveText("30.0 / 30", {
      timeout: 5000,
    });
    await expect(page.getByTestId("app")).toHaveAttribute(
      "data-playing",
      "false",
    );
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(30000);
    expect(elapsed).toBeLessThan(32000);
    console.log(`Playback ${run + 1}: ${elapsed}ms; canonical states verified`);
  }
  expect(external).toEqual([]);
});
test("node detail, unsupported state and record captions fit the recording canvas", async ({
  page,
}) => {
  await page.goto("/?demo=logistics");
  await page
    .getByLabel("운영 질문", { exact: true })
    .fill("지원하지 않는 질문");
  await page.getByRole("button", { name: "영향 분석 실행" }).click();
  await layout(page);
  await scene(page, 5);
  for (const node of await page.locator(".graph-node").all()) {
    await node.click();
    await layout(page);
  }
  await page.getByRole("button", { name: "녹화 모드", exact: true }).click();
  await expect(page.getByLabel("시연 자막")).toHaveText(
    "답변을 넘어, 실행 가능한 대응안으로",
  );
  await layout(page);
  await page.screenshot({ path: "test-results/record-1440.png" });
  await page.keyboard.press("6");
  await expect(page.getByLabel("시연 자막")).toHaveText(
    "이 모든 판단의 기반, 관리되는 기업 온톨로지",
  );
  await layout(page);
});

test("theme switching preserves analysis, persists, and supports keyboard and recording", async ({
  page,
}) => {
  await page.goto("/?demo=logistics");
  await scene(page, 5);
  const toggle = page.getByRole("button", {
    name: "라이트 모드로 전환",
    exact: true,
  });
  await toggle.focus();
  await toggle.press("Space");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.getByTestId("plan-preview")).toBeVisible();
  await expect(page.getByTestId("kpi-impacted")).toHaveText("38건");
  await expect(page.getByTestId("app")).toHaveAttribute(
    "data-playing",
    "false",
  );
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute(
    "href",
    "/astergraph-light.svg",
  );
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await scene(page, 5);
  await page.getByRole("button", { name: "녹화 모드", exact: true }).click();
  await expect(page.locator(".theme-toggle")).toBeHidden();
  await expect(
    page.getByText("DEMO · SIMULATED DATA", { exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "다크 모드로 전환", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByTestId("plan-preview")).toBeVisible();
});

for (const size of [
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
])
  test(`light theme all views and contrast ${size.width}`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto("/?demo=logistics");
    await page
      .getByRole("button", { name: "라이트 모드로 전환", exact: true })
      .click();
    for (const n of [1, 2, 3, 4, 5, 6]) {
      await scene(page, n);
      if (n === 4)
        await page
          .getByRole("button", { name: "LM-1001", exact: true })
          .click();
      await layout(page);
      if ([4, 5, 6].includes(n))
        await page.screenshot({
          path: `test-results/light-${size.width}-scene-${n}.png`,
          animations: "disabled",
        });
    }
    for (const name of ["Overview", "Ontology Explorer", "Data Sources"]) {
      await page.getByRole("button", { name, exact: true }).click();
      await layout(page);
    }
    const contrast = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      const luminance = (hex: string) => {
        const channels = hex
          .trim()
          .slice(1)
          .match(/.{2}/g)!
          .map((c) => parseInt(c, 16) / 255)
          .map((c) =>
            c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
          );
        return (
          channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
        );
      };
      const background = luminance(style.getPropertyValue("--color-raised"));
      return ["ink", "secondary", "muted", "blue", "teal", "coral"].map(
        (token) => {
          const foreground = luminance(
            style.getPropertyValue(`--color-${token}`),
          );
          return {
            token,
            ratio:
              (Math.max(background, foreground) + 0.05) /
              (Math.min(background, foreground) + 0.05),
          };
        },
      );
    });
    for (const { token, ratio } of contrast)
      expect(ratio, token).toBeGreaterThanOrEqual(4.5);
  });

test("theme remains usable without local storage and mobile header fits", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("Storage unavailable", "SecurityError");
      },
    });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?demo=logistics");
  await page
    .getByRole("button", { name: "라이트 모드로 전환", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator(".mobile-brand")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await page.screenshot({ path: "test-results/light-mobile.png" });
});

test("ending exposes the shared ontology and opens the read-only model", async ({
  page,
}) => {
  await page.goto("/?demo=logistics");
  await scene(page, 5);
  await expect(page.getByTestId("kpi-impacted")).toHaveText("38건");
  await scene(page, 6);
  const ending = page.locator(".foundation-end");
  await expect(ending.locator("#foundation-heading")).toHaveText(
    "모든 판단의 기반,관리되는 기업 온톨로지.",
  );
  await expect(ending.locator(".ontology-node")).toHaveCount(6);
  await expect(ending.locator(".model-bar")).toContainText(
    "6개 개념 · 6개 관계",
  );
  await ending
    .getByRole("button", { name: "Product 상품 PIM", exact: true })
    .click();
  await expect(ending.locator(".foundation-selection")).toContainText(
    "PIM 매핑",
  );
  await expect(ending.locator(".foundation-selection")).toContainText(
    "동일 SKU만 배정",
  );
  await layout(page);
  await ending
    .getByRole("button", { name: "관계 모델 살펴보기", exact: true })
    .click();
  await expect(page.locator("h1")).toHaveText("Ontology Explorer");
  await expect(page.locator(".ontology-node")).toHaveCount(6);
  await scene(page, 5);
  await expect(page.getByTestId("kpi-impacted")).toHaveText("38건");
  await expect(page.getByTestId("kpi-risk")).toHaveText("12건");
});

test("ontology workbench searches, traces relations and inspects actual mock data", async ({
  page,
}) => {
  await page.goto("/?demo=logistics");
  await scene(page, 6);
  const model = page.getByRole("region", { name: "기업 온톨로지 탐색 작업대" });
  await model.getByRole("button", { name: "데이터 예시", exact: true }).click();
  await expect(model.locator(".model-sample")).toContainText("INV-BUSAN-A");
  await expect(model.locator(".model-sample")).toContainText("26");
  await model.getByRole("button", { name: "개념 정보", exact: true }).click();
  await model
    .getByRole("button", {
      name: "보관 위치: Inventory → Warehouse",
      exact: true,
    })
    .click();
  await expect(model.locator(".model-relation-id")).toHaveText("storedAt");
  await model
    .locator(".model-relation-endpoints")
    .getByRole("button", { name: "물류센터 Warehouse", exact: true })
    .click();
  await expect(model.locator(".ontology-detail h2")).toHaveText("Warehouse");
  await model
    .getByRole("searchbox", { name: "개념 또는 시스템 검색" })
    .fill("없는 개념");
  await expect(
    model.getByText("일치하는 개념이 없습니다", { exact: true }),
  ).toBeVisible();
  await model.getByRole("button", { name: "검색 초기화", exact: true }).click();
  await model
    .getByLabel("원천 시스템 필터", { exact: true })
    .selectOption("PIM");
  await expect(model.getByRole("status")).toContainText("1개 개념 일치");
  await expect(model.locator(".ontology-node:not(.node-muted)")).toHaveCount(1);
  await model.getByRole("searchbox").press("Enter");
  await expect(model.locator(".ontology-detail h2")).toHaveText("Product");
  await model
    .getByRole("button", { name: "모델 보기 초기화", exact: true })
    .click();
  await model.getByRole("checkbox", { name: "선택 개념의 연결 강조" }).check();
  await expect(model.locator(".ontology-node:not(.node-muted)")).toHaveCount(3);
  await model
    .getByRole("button", { name: "모델 보기 초기화", exact: true })
    .click();
  await expect(model.locator(".ontology-node:not(.node-muted)")).toHaveCount(6);
  await expect(model.locator(".ontology-detail h2")).toHaveText("Inventory");
  await page.getByRole("button", { name: "재개", exact: true }).click();
  await model
    .getByRole("button", { name: "Product 상품 PIM", exact: true })
    .click();
  await expect(page.getByTestId("app")).toHaveAttribute(
    "data-playing",
    "false",
  );
  await scene(page, 6);
  await expect(model.locator(".ontology-detail h2")).toHaveText("Inventory");
});

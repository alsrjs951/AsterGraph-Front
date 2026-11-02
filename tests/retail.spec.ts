import { test, expect, type Page } from "@playwright/test";
import { dossier, question } from "../src/features/retail/model";
import { captionAt, scenes } from "../src/features/retail/story";

test("manual retail investigation and original document references", async ({
  page,
  request,
}) => {
  await page.goto("/?demo=retail-case");
  const button = (name: string | RegExp) =>
    page.getByRole("button", { name, exact: typeof name === "string" });
  const evidence = page.getByRole("complementary", { name: "원문 근거" });
  await expect(evidence).toContainText(dossier.notice.reason);
  await button("데이터 카탈로그").click();
  for (const doc of Object.values(dossier)) {
    await button(new RegExp(doc.file)).click();
    const url = await evidence.getByRole("link").getAttribute("href");
    expect(url).toBe("/retail/" + doc.file);
    const response = await request.get(url!);
    expect(response.ok()).toBe(true);
    const file = await response.body();
    if (doc.file.endsWith("csv")) expect(file.toString()).toContain("ID");
    else
      expect(file.subarray(0, 2).toString()).toBe(
        doc.file.endsWith("pdf") ? "%P" : "PK",
      );
  }
  await button("공급사 공지").click();
  await button("납품 변경 확인").click();
  await expect(page.locator(".rt-diff")).toContainText("납품 정상");
  await expect(page.locator(".rt-new")).toContainText("납품 중단");
  await button("관련 행사 찾기").click();
  await page.getByLabel("업무 질문").fill("다른 질문");
  await button("검색").click();
  await expect(
    page.getByRole("status").filter({ hasText: "이 시연에서는" }),
  ).toBeVisible();
  await button(/추천 질문/).click();
  await expect(page.getByLabel("업무 질문")).toHaveValue(question);
  await button("검색").click();
  await expect(page.getByLabel("조회 답변")).toContainText("E-07");
  await button("[2] 매장 행사 배정.csv").click();
  await expect(evidence).toContainText("CSV / 2·3행");
  await expect(evidence).toContainText("서면점");
  await expect(evidence).toContainText("해운대점");
  await button("참여 매장 추적").click();
  await button(/상품 · P-101/).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".rt-graph")).toHaveClass(/rt-traced/);
  await button(/P-101 → 제철 감귤 기획전/).click();
  await expect(evidence).toContainText("행사 계획 시트 / 2행");
  await button("매장 배정표 대조").click();
  await expect(page.getByLabel("레코드 검색")).toHaveValue("E-07");
  await expect(page.locator(".km-rows button")).toHaveCount(2);
  await button("검토 메모 정리").click();
  await expect(page.locator(".rt-closing")).toBeVisible();
  await button(/검토 메모 남기기/).click();
  await expect(page.getByLabel("검토 메모", { exact: false })).toHaveValue(
    /서면점·해운대점/,
  );
  await button("닫기").click();
  await button(/시연 데이터/).click();
  await expect(page.getByRole("dialog")).toContainText("로컬 자료");
});

async function snapshot(p: Page) {
  return Promise.all(
    [".rt-workspace", "h1", ".demo-caption"].map((sel) =>
      p.locator(sel).innerText(),
    ),
  );
}
for (const [width, height, theme] of [
  [1440, 900, "dark"],
  [1920, 1080, "light"],
] as const) {
  test(`retail replay matches seeks and stops at 60s · ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.addInitScript(
      (t) => localStorage.setItem("astergraph-theme", t),
      theme,
    );
    await page.clock.install({ time: new Date("2026-11-02T00:00:00Z") });
    await page.goto("/?demo=retail-case");
    await page.clock.pauseAt(new Date("2026-11-02T00:01:00Z"));
    await page.getByRole("button", { name: "녹화 모드", exact: true }).click();
    const expected = [];
    for (let i = 0; i < scenes.length; i++) {
      await page.keyboard.press(String(i + 1));
      await expect(page.locator(".demo-caption")).toHaveText(scenes[i].caption);
      expected.push(await snapshot(page));
    }
    await page.keyboard.press("r");
    let previous = 0;
    for (const time of [
      0, 7000, 10000, 15000, 17200, 19000, 20000, 25000, 27500, 29000, 33500,
      36500, 39000, 43500, 49000, 54000, 60000,
    ]) {
      if (time > previous) await page.clock.fastForward(time - previous);
      previous = time;
      await expect(page.locator(".demo-caption")).toHaveText(captionAt(time));
      const index = scenes.findIndex((s) => s.time === time);
      if (index >= 0) expect(await snapshot(page)).toEqual(expected[index]);
      if (time === 27500)
        await expect(page.locator(".rt-node[aria-pressed=true]")).toContainText(
          "P-101",
        );
      if (time === 29000)
        await expect(page.locator(".rt-locator")).toContainText(
          "행사 계획 시트 / 2행",
        );
      if (time === 43500)
        await expect(page.locator(".rt-locator")).toContainText("2·3행");
      const overflow = await page.evaluate(() => {
        const cap = document
          .querySelector(".demo-caption")!
          .getBoundingClientRect();
        const panels = [
          ...document.querySelectorAll(
            ".rt-card,.rt-evidence,.rt-graph,.rt-node,.rt-evidence-body",
          ),
        ];
        return {
          w: document.documentElement.scrollWidth,
          h: document.documentElement.scrollHeight,
          overlap: panels.some(
            (el) => el.getBoundingClientRect().bottom > cap.top,
          ),
          clipped: panels
            .filter((el) => el.scrollHeight > el.clientHeight + 2)
            .map((el) => el.className),
        };
      });
      expect(overflow).toEqual({
        w: width,
        h: height,
        overlap: false,
        clipped: [],
      });
    }
    await expect(page.locator(".retail")).toHaveAttribute(
      "data-playing",
      "false",
    );
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("timecode")).toHaveText("60.0 / 60");
    await page.getByRole("button", { name: "60초 데모 시작" }).click();
    await page.clock.fastForward(1000);
    await page.getByRole("button", { name: "일시정지", exact: true }).click();
    await page.clock.fastForward(1500);
    await expect(page.getByTestId("timecode")).toHaveText("1.0 / 60");
  });
}

test("catalog pagination, exact ID lookup, document row and durable product reviews", async ({
  page,
}) => {
  await page.goto("/?demo=retail-case");
  const button = (name: string) =>
    page.getByRole("button", { name, exact: true });
  await button("데이터 카탈로그").click();
  await button("레코드 탐색").click();
  await expect(page.locator(".km-pager")).toContainText("1,258건 중 1–5");
  await button("다음 결과").click();
  await expect(page.locator(".km-pager")).toContainText("6–10");
  await page.getByLabel("원본 필터").selectOption("changes");
  await page.getByLabel("레코드 검색").fill("p-101");
  await expect(page.locator(".km-rows button")).toHaveCount(2);
  await page.locator(".km-rows button").last().click();
  await expect(page.locator(".rt-locator")).toHaveText("CSV / 3행");
  await button("P-101 검토 이력 보기 →").click();
  await page.getByLabel("검토 메모").fill("행사 담당자와 원본 확인");
  await button("검토 시작").click();
  await button("검토 완료 기록").click();
  await page.reload();
  await page.locator(".km-strip").click();
  await expect(page.getByRole("dialog")).toContainText(
    "행사 담당자와 원본 확인",
  );
  await expect(button("재검토 시작")).toBeVisible();
  await button("재검토 시작").click();
  await button("닫기").click();
  await expect(page.locator(".km-strip")).toContainText("검토 중");
  await button("데이터 카탈로그").click();
  await button("레코드 탐색").click();
  await page.getByLabel("레코드 검색").fill("P-1383");
  await page.locator(".km-rows button").first().click();
  await button("P-1383 검토 이력 보기 →").click();
  await expect(button("검토 시작")).toBeVisible();
  await expect(page.getByRole("dialog")).not.toContainText(
    "행사 담당자와 원본 확인",
  );
  await button("닫기").click();
  await page.getByLabel("레코드 검색").fill("없는 상품");
  await expect(
    page.getByText("일치하는 기록이 없습니다.", { exact: false }),
  ).toBeVisible();
});

import { test, expect, type Page } from "@playwright/test";
import {
  captionAt,
  question,
  scenes,
} from "../src/features/knowledge/workflow";
test("manual approval, revision evidence and isolated replay", async ({
  page,
}) => {
  await page.goto("/");
  const button = (name: string | RegExp) =>
    page.getByRole("button", { name, exact: typeof name === "string" });
  await button("자료 카탈로그").click();
  await expect(page.locator(".km-volume")).toContainText("1,258");
  await button("행사 준비로 이동").click();
  await expect(page.locator(".batch-inbox")).toContainText("등록된 원본 3개");
  await button("묶음으로 구축").click();
  await expect(page.locator(".batch-atlas")).toContainText(
    "개체 515개 · 관계 871개",
  );
  await button("전체 대조 내역").click();
  const ledger = page.getByRole("dialog");
  await ledger.getByRole("checkbox").check();
  await expect(ledger.locator(".batch-ledger button")).toHaveCount(1);
  await ledger.locator(".batch-ledger button").click();
  await expect(page.locator(".rt-locator")).toContainText("2행");
  await button("예외 검수 열기").click();
  await expect(button("묶음 승인 · v1")).toBeDisabled();
  await expect(page.locator(".rt-evidence")).toContainText(
    "행사 계획 시트 / 2행",
  );
  await button("제안 적용 · E-07").click();
  await expect(page.locator(".kg")).toHaveAttribute("data-version", "0");
  await button("묶음 승인 · v1").click();
  await button("변경 관리 열기").click();
  await expect(page.locator(".kg-graph")).not.toContainText("E-08");
  await button("장면 4: 질문·근거").click();
  await expect(page.locator(".kg")).toHaveAttribute("data-version", "2");
  await button("수동 작업으로").click();
  await expect(page.locator(".kg")).toHaveAttribute("data-version", "1");
  await button("변경 1건 검토").click();
  await expect(page.locator(".rt-evidence")).toContainText("CSV / 2·3행");
  await button("변경 승인 · v2").click();
  await button("승인 이력 보기").click();
  const history = page.getByRole("dialog");
  await expect(history).toContainText("승인본 v1 · 납품 정상");
  await expect(history).toContainText("변경본 v2 · 납품 중단");
  await history.getByRole("button", { name: /상품 변경 목록/ }).click();
  await expect(page.locator(".rt-locator")).toHaveText("CSV / 3행");
  await button("승인본으로 질문").click();
  await page.getByLabel("업무 질문").fill("다른 질문");
  await button("조회").click();
  await expect(page.locator(".kg-suggestion")).toContainText(
    "이 시연에서 조회할 수 있는 질문",
  );
  await button(new RegExp(question.slice(0, 8))).click();
  await button("조회").click();
  await expect(page.locator(".kg-result h3")).toHaveText(
    "11월 3일 제철 감귤 기획전 · 서면점 · 해운대점",
  );
  await button("매장 배정표 2·3행").click();
  await expect(page.locator(".rt-evidence")).toContainText("해운대점");
  await expect(page.locator(".rt-evidence")).not.toContainText("광안점");
  await expect(page.locator(".rt-evidence a")).toHaveAttribute(
    "href",
    "/retail/매장 행사 배정.csv",
  );
  await page.reload();
  await expect(page.locator(".kg")).toHaveAttribute("data-version", "2");
});
async function snapshot(page: Page) {
  return page
    .locator(".rt-workspace")
    .evaluate((el) => [
      el.innerHTML,
      el.querySelector("select")?.value,
      el.querySelector("input")?.value,
    ]);
}
for (const [width, height] of [
  [1440, 900],
  [1920, 1080],
])
  test("knowledge playback and layout " + width, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const epoch = new Date("2026-11-02T00:00:00Z");
    await page.clock.install({ time: epoch });
    await page.goto("/");
    await page.clock.pauseAt(new Date(+epoch + 60000));
    await page.getByRole("button", { name: "녹화 모드", exact: true }).click();
    const seek = [];
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press(String(i + 1));
      await expect(page.locator(".demo-caption")).toHaveText(scenes[i].caption);
      seek.push(await snapshot(page));
    }
    await page.keyboard.press("r");
    let prev = 0;
    for (const t of [
      0, 4000, 8500, 15000, 19000, 22200, 25000, 29500, 32600, 34000, 36500,
      40600, 45000, 47500, 49200, 53500, 60000,
    ]) {
      if (t > prev) await page.clock.fastForward(t - prev);
      prev = t;
      await expect(page.locator(".demo-caption")).toHaveText(captionAt(t));
      const scene = scenes.findIndex((s) => s.time === t);
      if (scene >= 0) expect(await snapshot(page)).toEqual(seek[scene]);
      const problems = await page.evaluate(() => {
        const cap = document
          .querySelector(".demo-caption")!
          .getBoundingClientRect();
        return [
          ...document.querySelectorAll(
            ".rt-card,.rt-evidence,.rt-evidence-body,.kg-node,.rt-record,.kg-next",
          ),
        ]
          .filter(
            (e) =>
              e.getBoundingClientRect().bottom > cap.top ||
              e.scrollHeight > e.clientHeight + 2 ||
              e.scrollWidth > e.clientWidth + 2,
          )
          .map((e) => e.className);
      });
      expect(problems).toEqual([]);
    }
    await expect(page.locator(".kg")).toHaveAttribute("data-playing", "false");
    await expect(page.locator(".rt-locator")).toHaveText("CSV / 2·3행");
    await expect(page.locator(".kg-next")).toContainText(
      "두 매장의 재고 확인 후 행사 물량 조정 검토",
    );
  });

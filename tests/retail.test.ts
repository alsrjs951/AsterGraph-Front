import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
import dossier from "../src/features/retail/dossier.json";

test("changing event links and store assignments updates review, graph, answer, summary and source rows together", async () => {
  const data = structuredClone(dossier);
  data.events.rows[0][2] = "P-204";
  data.events.rows[1][2] = "P-101";
  data.stores.rows.unshift(["E-08", "온천점"], ["E-08", "동래점"]);
  vi.resetModules();
  vi.doMock("../src/features/retail/dossier.json", () => ({ default: data }));
  try {
    const { RetailScenes, Evidence } =
      await import("../src/features/retail/RetailScenes");
    const { interact, viewAt } = await import("../src/features/retail/story");
    const { question } = await import("../src/features/retail/model");
    const markup = (time: number) =>
      renderToStaticMarkup(
        createElement(RetailScenes, { view: viewAt(time), send: () => {} }),
      );
    for (const time of [25000, 44300, 54000]) {
      expect(markup(time)).toContain("온천점");
      expect(markup(time)).toContain("광안점");
      expect(markup(time)).not.toContain("해운대점");
      expect(markup(time)).toContain("E-08");
    }
    expect(markup(20000)).toContain("E-08");
    expect(markup(54000)).toMatch(/참여 매장<\/small><strong>3/);
    const answered = interact(
      interact(viewAt(15000), { type: "query", value: question }),
      { type: "submit" },
    );
    expect(answered).toEqual(viewAt(20000));
    const evidence = renderToStaticMarkup(
      createElement(Evidence, {
        citation: viewAt(48600).citation,
        onInteract: () => {},
      }),
    );
    expect(evidence).toContain("2·3·6행");
  } finally {
    vi.doUnmock("../src/features/retail/dossier.json");
    vi.resetModules();
  }
});

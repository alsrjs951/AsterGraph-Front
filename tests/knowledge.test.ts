import { expect, it, vi } from "vitest";
import {
  apply,
  approvedResult,
  initialWork,
  workAt,
} from "../src/features/knowledge/workflow";
it("rejects unreviewed links and premature revisions", () => {
  const w = initialWork();
  expect(apply(w, { type: "approve" })).toBe(w);
  const wrong = workAt(15000);
  expect(apply(wrong, { type: "approve" })).toBe(wrong);
  const approved = workAt(25000);
  expect(apply(approved, { type: "edit", value: "E-08" })).toBe(approved);
  expect(apply(approved, { type: "update" })).toBe(approved);
  expect(apply(approved, { type: "ask" })).toBe(approved);
  expect(
    approvedResult(workAt(60000).revisions[1])!.stores.map((s) => s.cells[1]),
  ).toEqual(["서면점", "해운대점"]);
});
it("derives the approval, impact, QA and citations from changed source links", async () => {
  vi.resetModules();
  const { dossier, investigate } = await import("../src/features/retail/model");
  const data = structuredClone(dossier);
  data.events.rows[0][0] = "E-77";
  data.events.rows[0][1] = "감귤 특별 행사";
  data.stores.rows[0] = ["E-77", "남포점"];
  data.stores.rows[1][0] = "E-08";
  vi.doMock("../src/features/retail/model", () => ({
    dossier: data,
    impact: investigate(data),
  }));
  try {
    const workflow = await import("../src/features/knowledge/workflow");
    for (const time of [22200, 36500, 40600, 53500, 60000]) {
      const frame = workflow.workAt(time);
      const result = workflow.approvedResult(frame.revisions.at(-1))!;
      expect(result.event.cells.slice(0, 2)).toEqual([
        "E-77",
        "감귤 특별 행사",
      ]);
      expect(result.stores.map((r) => r.cells[1])).toEqual(["남포점"]);
      if (time === 36500 || time >= 53500)
        expect(frame.citation).toEqual({ source: "stores", rows: [2] });
    }
  } finally {
    vi.doUnmock("../src/features/retail/model");
    vi.resetModules();
  }
});
it("keeps the whole batch in draft if an additional foreign key is unresolved", async () => {
  vi.resetModules();
  const { dossier, investigate } = await import("../src/features/retail/model");
  const data = structuredClone(dossier);
  data.stores.rows.push(["E-missing", "서면점"]);
  vi.doMock("../src/features/retail/model", () => ({
    dossier: data,
    impact: investigate(data),
  }));
  try {
    const workflow = await import("../src/features/knowledge/workflow");
    const draft = workflow.workAt(19000);
    expect(draft.candidateId).toBe("E-07");
    expect(workflow.apply(draft, { type: "approve" }).revisions).toHaveLength(
      0,
    );
  } finally {
    vi.doUnmock("../src/features/retail/model");
    vi.resetModules();
  }
});

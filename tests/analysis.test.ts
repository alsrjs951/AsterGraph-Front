import { describe, it, expect } from "vitest";
import { analyze } from "../src/mocks/analysis";
import { QUESTION, seed } from "../src/mocks/seed";
import {
  initialWorkspace,
  supportedQuestion,
  workspaceReducer,
} from "../src/app/state";
import { appReducer, initialApp } from "../src/app/controller";
import { sceneIndex, stateAt } from "../src/demo/timeline";
describe("deterministic business analysis", () => {
  it("partitions 120 unique orders into the exact impact sets", () => {
    const r = analyze(seed);
    expect(new Set(seed.orders.map((o) => o.id)).size).toBe(120);
    expect([
      r.totalOrders,
      r.impacted.length,
      r.reroutable.length,
      r.risk.length,
    ]).toEqual([120, 38, 26, 12]);
    expect(r.totalOrders - r.impacted.length).toBe(82);
    expect(new Set([...r.reroutable, ...r.risk].map((o) => o.id)).size).toBe(
      38,
    );
  });
  it("uses warehouse and pending status together", () => {
    const r = analyze({
      ...seed,
      orders: seed.orders.map((o) =>
        o.id === "LM-1001" ? { ...o, status: "SHIPPED" as const } : o,
      ),
    });
    expect(r.impacted.length).toBe(37);
    expect(
      r.impacted.every(
        (o) => o.allocatedWarehouseId === "BUSAN" && o.status === "PENDING",
      ),
    ).toBe(true);
  });
  it("limits allocation by SKU and inventory, even if input is shuffled", () => {
    const data = {
      ...seed,
      inventories: seed.inventories.map((i) =>
        i.id === "INV-SEOUL-A" ? { ...i, available: 25 } : i,
      ),
    };
    const r = analyze(data);
    expect([r.reroutable.length, r.risk.length]).toEqual([25, 13]);
    expect(r.evidence["LM-1026"].allocated).toBe(0);
    expect(analyze({ ...data, orders: [...data.orders].reverse() })).toEqual(r);
  });
  it("explains both representative orders from inventory and relationships", () => {
    const r = analyze(seed);
    const a = r.evidence["LM-1001"],
      b = r.evidence["LM-1027"];
    expect([a.available, a.allocated, a.reroutable]).toEqual([26, 1, true]);
    expect([b.available, b.allocated, b.reroutable]).toEqual([0, 0, false]);
    for (const e of [a, b]) {
      expect(e.nodes).toHaveLength(7);
      expect(
        e.edges.every(
          (edge) =>
            e.nodes.some((n) => n.id === edge.from) &&
            e.nodes.some((n) => n.id === edge.to),
        ),
      ).toBe(true);
    }
  });
  it("keeps frozen source data unchanged across three runs and plan toggles", () => {
    const original = JSON.stringify(seed);
    for (let i = 0; i < 3; i++) {
      let s = workspaceReducer(initialWorkspace(), {
        type: "query",
        value: QUESTION,
      });
      s = workspaceReducer(s, { type: "analyze" });
      s = workspaceReducer(s, { type: "complete" });
      const result = s.result;
      s = workspaceReducer(s, { type: "plan", applied: true });
      s = workspaceReducer(s, { type: "plan", applied: false });
      expect(s.result).toBe(result);
      expect(s.result?.afterRisk).toBe(12);
    }
    expect(JSON.stringify(seed)).toBe(original);
  });
  it("rejects unsupported questions and clears stale results on edit", () => {
    expect(supportedQuestion(` ${QUESTION} `)).toBe(true);
    expect(supportedQuestion("내일 매출이 얼마인가요?")).toBe(false);
    let s = stateAt(19000);
    s = workspaceReducer(s, { type: "query", value: "매출" });
    s = workspaceReducer(s, { type: "analyze" });
    expect(s.result).toBeNull();
    expect(s.plan).toBe(false);
    expect(s.error).toContain("현재 데모에서는");
  });
  it("shares filter membership and selection with the result", () => {
    const s = workspaceReducer(stateAt(14200), {
      type: "filter",
      filter: "risk",
      pageSize: 6,
    });
    expect(s.selected).toBe("LM-1027");
    expect(s.orderPage).toBe(0);
    expect(s.result?.risk).toHaveLength(12);
  });
});
describe("timeline and controller", () => {
  it.each([
    [0, 0, "overview"],
    [3999, 0, "overview"],
    [4000, 1, "operations"],
    [6999, 1, "operations"],
    [7000, 2, "operations"],
    [11999, 2, "operations"],
    [12000, 3, "operations"],
    [18999, 3, "operations"],
    [19000, 4, "operations"],
    [26999, 4, "operations"],
    [27000, 5, "end"],
    [30000, 5, "end"],
  ] as const)("reconstructs boundary %i", (time, index, page) => {
    expect(sceneIndex(time)).toBe(index);
    expect(stateAt(time).page).toBe(page);
  });
  it("reconstructs typing, loading, selection, and plans in either direction", () => {
    expect(stateAt(8100).query.length).toBeGreaterThan(0);
    expect(stateAt(8100).query.length).toBeLessThan(QUESTION.length);
    expect(stateAt(8100, true).query).toBe(QUESTION);
    expect(stateAt(11400).status).toBe("analyzing");
    expect(stateAt(12000).result?.beforeRisk).toBe(38);
    expect(stateAt(14199).selected).toBeNull();
    expect(stateAt(14200).selected).toBe("LM-1001");
    for (const t of [19000, 7000, 27000, 12000]) {
      const s = appReducer(initialApp(), { type: "seek", time: t });
      expect(s.workspace).toEqual(stateAt(t));
    }
  });
  it("ignores a stale analysis completion after reset", () => {
    let s = appReducer(initialApp(), {
      type: "command",
      command: { type: "query", value: QUESTION },
    });
    s = appReducer(s, { type: "command", command: { type: "analyze" } });
    const generation = s.generation;
    s = appReducer(s, { type: "reset" });
    s = appReducer(s, { type: "analysis-finished", generation });
    expect(s.workspace.result).toBeNull();
    expect(s.workspace.status).toBe("idle");
  });
  it("pauses, resumes, stops at 30 seconds, and distinguishes reset from restart", () => {
    let s = appReducer(initialApp(), { type: "record", value: true });
    s = appReducer(s, { type: "start" });
    s = appReducer(s, { type: "tick", time: 15000 });
    s = appReducer(s, { type: "pause" });
    expect(appReducer(s, { type: "tick", time: 16000 }).time).toBe(15000);
    s = appReducer(s, { type: "toggle" });
    s = appReducer(s, { type: "tick", time: 31000 });
    expect([s.time, s.playing, s.workspace.page]).toEqual([
      30000,
      false,
      "end",
    ]);
    s = appReducer(s, { type: "start" });
    expect(s.record).toBe(true);
    s = appReducer(s, { type: "reset" });
    expect([s.record, s.active, s.workspace.page]).toEqual([
      false,
      false,
      "operations",
    ]);
  });
  it("manual action pauses playback; resume restores the canonical time state", () => {
    let s = appReducer(initialApp(), { type: "start" });
    s = appReducer(s, { type: "tick", time: 19000 });
    s = appReducer(s, {
      type: "command",
      command: { type: "filter", filter: "risk", pageSize: 6 },
    });
    expect(s.playing).toBe(false);
    expect(s.workspace.selected).toBe("LM-1027");
    s = appReducer(s, { type: "toggle" });
    expect(s.workspace).toEqual(stateAt(19000));
  });
});
it("manual analysis completes after navigation without leaving a loading state", () => {
  let s = appReducer(initialApp(), {
    type: "command",
    command: { type: "query", value: QUESTION },
  });
  s = appReducer(s, { type: "command", command: { type: "analyze" } });
  const generation = s.generation;
  s = appReducer(s, {
    type: "command",
    command: { type: "navigate", page: "sources" },
  });
  s = appReducer(s, { type: "analysis-finished", generation });
  expect(s.workspace.page).toBe("sources");
  expect(s.workspace.status).toBe("done");
  expect(s.workspace.result?.impacted.length).toBe(38);
});

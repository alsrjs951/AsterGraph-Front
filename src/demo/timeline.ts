import { initialWorkspace, workspaceReducer, type Command } from "../app/state";
import { QUESTION } from "../mocks/seed";
export const DURATION = 30_000;
export const scenes = [
  { time: 0, label: "문제", caption: "하나의 장애, 여러 시스템" },
  { time: 4000, label: "연결", caption: "흩어진 데이터를 하나로 연결" },
  { time: 7000, label: "질문", caption: "복잡한 분석도 질문 하나로" },
  { time: 12000, label: "영향·근거", caption: "영향받는 주문과 판단 근거까지" },
  {
    time: 19000,
    label: "대응안",
    caption: "답변을 넘어, 실행 가능한 대응안으로",
  },
  {
    time: 27000,
    label: "결론",
    caption: "이 모든 판단의 기반, 관리되는 기업 온톨로지",
  },
] as const;
const events: { time: number; command: Command }[] = [
  { time: 0, command: { type: "navigate", page: "overview" } },
  { time: 4000, command: { type: "navigate", page: "operations" } },
  { time: 9200, command: { type: "query", value: QUESTION } },
  { time: 11400, command: { type: "analyze" } },
  { time: 12000, command: { type: "complete" } },
  { time: 14200, command: { type: "select", id: "LM-1001" } },
  { time: 19000, command: { type: "plan", applied: true } },
  { time: 27000, command: { type: "navigate", page: "end" } },
];
// Snapshots use the same reducer as manual interaction. Analysis is computed once per immutable seed.
let snapshot = initialWorkspace();
const snapshots = events.map((event) => {
  snapshot = workspaceReducer(snapshot, event.command);
  return snapshot;
});
export function sceneIndex(time: number) {
  return Math.max(
    0,
    scenes.findLastIndex((s) => time >= s.time),
  );
}
export function stateAt(time: number, reducedMotion = false) {
  const t = Math.max(0, Math.min(DURATION, time));
  const index = events.findLastIndex((e) => t >= e.time);
  const base = snapshots[index];
  if (t >= 7000 && t < 9200)
    return workspaceReducer(base, {
      type: "query",
      value: QUESTION.slice(
        0,
        reducedMotion
          ? QUESTION.length
          : Math.floor(((t - 7000) / 2200) * QUESTION.length),
      ),
    });
  return base;
}

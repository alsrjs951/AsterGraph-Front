import { impact, question, type Source, type Citation } from "./model";

export const duration = 60_000;
const firstEvent = impact.events[0]?.cells;
const assignmentCount = impact.assignments.filter(
  (row) => row.cells[0] === firstEvent?.[0],
).length;
function shortDate(iso: string) {
  return Number(iso.slice(5, 7)) + "월 " + Number(iso.slice(8, 10)) + "일";
}
export const scenes = [
  {
    time: 0,
    label: "공지",
    title: "공급사 공지",
    caption:
      shortDate(impact.latest.cells[1]) +
      "부터 " +
      impact.name +
      "의 납품이 중단됩니다.",
  },
  {
    time: 7000,
    label: "변경 확인",
    title: "변경 관리",
    caption: "정상 납품을 전제로 짜 둔 행사 일정은 괜찮을까요?",
  },
  {
    time: 15000,
    label: "행사 찾기",
    title: "근거 기반 질의",
    caption: "구매 담당자가 이 상품을 쓰는 행사를 찾습니다.",
  },
  {
    time: 25000,
    label: "매장 추적",
    title: "지식그래프",
    caption: "이 행사를 준비하고 있는 매장은 어디일까요?",
  },
  {
    time: 39000,
    label: "원본 대조",
    title: "데이터 카탈로그",
    caption: "이 행사에 배정된 매장이 더 있을까요? 배정표를 열어 봅니다.",
  },
  {
    time: 49000,
    label: "검토 인계",
    title: "검토 요약",
    caption: "구매운영팀의 검토 메모에 행사 일정과 참여 매장이 모였습니다.",
  },
] as const;
const details = [
  {
    time: 20000,
    text: firstEvent
      ? shortDate(firstEvent[3]) +
        ", " +
        firstEvent[1] +
        "에 이 상품이 필요합니다."
      : "이 상품이 필요한 행사 계획은 없습니다.",
  },
  {
    time: 31500,
    text: impact.stores.length
      ? impact.stores.join("과 ") + "이 이 기획전에 참여합니다."
      : "참여 매장 배정은 아직 확인되지 않았습니다.",
  },
  {
    time: 43500,
    text: firstEvent
      ? firstEvent[0] +
        "에 해당하는 " +
        assignmentCount +
        "개 행이 그래프의 매장과 일치합니다."
      : "대조할 행사 배정 기록이 없습니다.",
  },
  {
    time: 54000,
    text: "이제 매장별 재고를 확인하고, 행사 물량을 조정할지 결정할 수 있습니다.",
  },
];
export function captionAt(time: number) {
  const scene = scenes.findLast((s) => s.time <= time) ?? scenes[0];
  return (
    details.findLast((c) => c.time >= scene.time && c.time <= time)?.text ??
    scene.caption
  );
}
export type CatalogState = {
  records: boolean;
  term: string;
  source: Source | "all";
  page: number;
};
export type View = {
  catalog: CatalogState;
  ledger: boolean;
  scene: number;
  selected: string;
  citation: Citation;
  query: string;
  answer: "idle" | "found" | "unsupported";
};
export type Interaction =
  | { type: "open"; scene: number }
  | { type: "select"; selected: string; citation: Citation }
  | { type: "cite"; citation: Citation }
  | { type: "query"; value: string }
  | { type: "catalog"; patch: Partial<CatalogState> }
  | { type: "ledger"; value: boolean }
  | { type: "verify" }
  | { type: "submit" };
function open(scene: number): View {
  const sources = [
    "notice",
    "changes",
    "notice",
    "products",
    "products",
    "events",
  ] as const;
  return {
    scene,
    catalog: { records: false, term: "", source: "all", page: 0 },
    ledger: false,
    selected: "",
    citation: { source: sources[scene] },
    query: "",
    answer: "idle",
  };
}
export function interact(view: View, action: Interaction): View {
  switch (action.type) {
    case "verify":
      return verifyAssignments(open(4));
    case "open":
      return open(action.scene);
    case "catalog":
      return { ...view, catalog: { ...view.catalog, ...action.patch } };
    case "ledger":
      return { ...view, ledger: action.value };
    case "select":
      return { ...view, selected: action.selected, citation: action.citation };
    case "cite":
      return { ...view, ledger: false, citation: action.citation };
    case "query":
      return {
        ...view,
        query: action.value,
        answer: "idle",
        citation: { source: "notice" },
      };
    case "submit": {
      const supported = view.query.trim() === question;
      return {
        ...view,
        answer: supported ? "found" : "unsupported",
        citation: { source: supported ? "events" : "notice" },
      };
    }
  }
}
// Open the catalog on the assignment rows for the event just traced.
export function verifyAssignments(view: View): View {
  const eventId = impact.events[0]?.cells[0] ?? "";
  const catalog = interact(view, {
    type: "catalog",
    patch: { records: true, source: "stores", term: eventId, page: 0 },
  });
  return interact(catalog, {
    type: "cite",
    citation: {
      source: "stores",
      rows: impact.assignments
        .filter((r) => r.cells[0] === eventId)
        .map((r) => r.row),
    },
  });
}
const events: { time: number; action: Interaction }[] = [
  { time: 10000, action: { type: "ledger", value: true } },
  { time: 17200, action: { type: "query", value: question } },
  { time: 19000, action: { type: "submit" } },
  {
    time: 25500,
    action: {
      type: "select",
      selected: impact.id,
      citation: { source: "products" },
    },
  },
  ...(impact.events.length
    ? [
        {
          time: 28200,
          action: {
            type: "select" as const,
            selected: "event-edge-" + impact.events[0].cells[0],
            citation: {
              source: "events" as const,
              rows: [impact.events[0].row],
            },
          },
        },
      ]
    : []),
  ...(impact.stores.length
    ? [
        {
          time: 31500,
          action: {
            type: "select" as const,
            selected: "store-" + impact.stores[0],
            citation: {
              source: "stores" as const,
              rows: [impact.assignments[0].row],
            },
          },
        },
      ]
    : []),
  ...(impact.stores.length > 1
    ? [
        {
          time: 35000,
          action: {
            type: "select" as const,
            selected: "store-" + impact.stores[1],
            citation: {
              source: "stores" as const,
              rows: impact.assignments
                .filter((r) => r.cells[1] === impact.stores[1])
                .map((r) => r.row),
            },
          },
        },
      ]
    : []),
];
export function viewAt(time: number, reduced = false): View {
  const scene = Math.max(
    0,
    scenes.findLastIndex((s) => time >= s.time),
  );
  let view = open(scene);
  if (scene === 4) view = verifyAssignments(view);
  for (const event of events) {
    if (event.time >= scenes[scene].time && event.time <= time)
      view = interact(view, event.action);
  }
  if (scene === 2 && time < 17200) {
    view = interact(view, {
      type: "query",
      value: question.slice(
        0,
        reduced
          ? question.length
          : Math.floor(((time - 15000) / 2200) * question.length),
      ),
    });
  }
  return view;
}

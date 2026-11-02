import { batch, unresolved } from "./batch";
import { dossier, impact, type Citation } from "../retail/model";

export const question =
  "감귤 납품 중단으로 어느 행사와 매장을 확인해야 하나요?";
export const eventRows = dossier.events.rows.map((cells, i) => ({
  cells,
  row: i + 2,
}));
export const expected = eventRows.find((e) => e.cells[2] === impact.id)!;
export const candidate = eventRows.find((e) => e.cells[0] === "E-08")!;
const storeRows = dossier.stores.rows.map((cells, i) => ({
  cells,
  row: i + 2,
}));
export const assignmentsFor = (id: string) =>
  storeRows.filter((r) => r.cells[0] === id);
export const sourceEvent: Citation = { source: "events", rows: [expected.row] };
export const sourceProduct: Citation = {
  source: "products",
  rows: [impact.product.row],
};
export const sourceStores: Citation = {
  source: "stores",
  rows: assignmentsFor(expected.cells[0]).map((r) => r.row),
};
export type Revision = {
  version: 1 | 2;
  product: string;
  event: string;
  status: string;
  evidence: Citation;
  reason: string;
  reviewer: string;
  reviewedLinks: number;
};
export type Page = "build" | "review" | "impact" | "answer" | "catalog";
export type Work = {
  page: Page;
  built: boolean;
  candidateId: string;
  inspecting: boolean;
  revisions: Revision[];
  citation: Citation;
  focus: string;
  traced: boolean;
  comparing: boolean;
  query: string;
  answer: "idle" | "found" | "unsupported";
};
export const initialWork = (): Work => ({
  page: "build",
  built: false,
  candidateId: candidate.cells[0],
  inspecting: false,
  revisions: [],
  citation: sourceProduct,
  focus: "product",
  traced: false,
  comparing: false,
  query: "",
  answer: "idle",
});
export function approvedResult(revision: Revision | undefined) {
  if (!revision) return null;
  const event = eventRows.find(
    (r) => r.cells[0] === revision.event && r.cells[2] === revision.product,
  );
  if (!event) return null;
  const stores = batch.links
    .filter(
      (link) =>
        link.source === "stores" &&
        link.valid &&
        link.from === "행사/" + revision.event,
    )
    .map((link) => storeRows[link.row - 2]);
  return { event, stores, revision };
}
export type Command =
  | { type: "page"; page: Page }
  | { type: "build" }
  | { type: "inspect" }
  | { type: "edit"; value: string }
  | { type: "approve" }
  | { type: "update" }
  | { type: "compare" }
  | { type: "select"; focus: string; citation: Citation }
  | { type: "cite"; citation: Citation }
  | { type: "query"; value: string }
  | { type: "ask" };
export function apply(w: Work, a: Command): Work {
  const latest = w.revisions.at(-1);
  switch (a.type) {
    case "page": {
      const citation = (
        {
          build: sourceProduct,
          review: sourceEvent,
          impact: { source: "notice" },
          answer: latest?.evidence ?? sourceProduct,
          catalog: sourceProduct,
        } satisfies Record<Page, Citation>
      )[a.page];
      return {
        ...w,
        page: a.page,
        inspecting: w.inspecting || (w.built && a.page === "review"),
        citation,
        comparing: false,
        focus: a.page === "impact" ? "notice" : w.focus,
      };
    }
    case "build":
      return w.built
        ? w
        : { ...w, built: true, focus: "batch", citation: sourceProduct };
    case "inspect":
      if (!w.built) return w;
      return {
        ...w,
        page: "review",
        inspecting: true,
        citation: sourceEvent,
        focus: "edge",
      };
    case "edit":
      return !latest && w.inspecting
        ? { ...w, candidateId: a.value, focus: "edge", citation: sourceEvent }
        : w;
    case "approve": {
      if (
        latest ||
        !w.built ||
        w.page !== "review" ||
        !w.inspecting ||
        unresolved(w.candidateId).length > 0
      )
        return w;
      return {
        ...w,
        revisions: [
          {
            version: 1,
            product: impact.id,
            event: w.candidateId,
            status: impact.before.cells[2],
            evidence: sourceEvent,
            reason: "원문 대조 후 준비 자료 묶음 승인",
            reviewer: "구매운영팀 담당자",
            reviewedLinks: batch.links.length,
          },
        ],
        focus: "event",
      };
    }
    case "select":
      return {
        ...w,
        citation: a.citation,
        focus: a.focus,
        traced:
          w.traced ||
          (w.page === "impact" && Boolean(latest) && a.focus === "stores"),
      };
    case "cite":
      return { ...w, citation: a.citation };
    case "compare":
      if (w.page !== "impact" || !latest) return w;
      return {
        ...w,
        traced: true,
        focus: "stores",
        comparing: true,
        citation: {
          source: "changes",
          rows: [impact.before.row, impact.latest.row],
        },
      };
    case "update": {
      if (
        w.page !== "impact" ||
        latest?.version !== 1 ||
        !w.comparing ||
        !w.traced
      )
        return w;
      return {
        ...w,
        revisions: [
          ...w.revisions,
          {
            ...latest,
            version: 2,
            status: impact.latest.cells[2],
            evidence: { source: "changes", rows: [impact.latest.row] },
            reason: dossier.notice.reason,
          },
        ],
        focus: "version",
        citation: { source: "notice" },
      };
    }
    case "query":
      return { ...w, query: a.value, answer: "idle" };
    case "ask": {
      if (latest?.version !== 2) return w;
      return {
        ...w,
        answer: w.query.trim() === question ? "found" : "unsupported",
        citation: {
          source: "events",
          rows: [approvedResult(latest)!.event.row],
        },
      };
    }
  }
}
export const scenes = [
  {
    time: 0,
    label: "지식 구축",
    page: "build",
    caption: "내일 시작할 감귤 기획전, 예정대로 준비해도 될까요?",
  },
  {
    time: 15000,
    label: "검수·승인",
    page: "review",
    caption: "담당자가 확인할 예외는 한 건입니다. 행사 계획 2행을 살펴봅니다.",
  },
  {
    time: 25000,
    label: "변경·영향",
    page: "impact",
    caption: "그런데 행사 하루 전, 감귤 납품이 중단됩니다.",
  },
  { time: 45000, label: "질문·근거", page: "answer", caption: question },
] as const;
export const duration = 60000;
const cues = [
  [0, scenes[0].caption],
  [4000, "준비 자료를 한 번에 넣으면 상품과 행사, 매장이 그래프로 연결됩니다."],
  [8500, "모든 관계를 원본과 대조하고, 값이 다른 연결만 검수함에 모읍니다."],
  [15000, scenes[1].caption],
  [19000, "원문에서 찾은 E-07을 적용하면 감귤의 행사 연결이 바로잡힙니다."],
  [22200, "담당자가 묶음을 승인하면 이 버전을 업무에 사용할 수 있습니다."],
  [25000, scenes[2].caption],
  [29500, "11월 2일부터 납품 중단. 기획전은 바로 다음 날 시작합니다."],
  [34000, "확인해 둔 연결을 따라가면, 다시 검토할 행사와 매장이 드러납니다."],
  [
    40600,
    "담당자는 바뀐 납품 상태만 승인합니다. 원문과 변경 이유는 v2에 남습니다.",
  ],
  [45000, scenes[3].caption],
  [49200, "11월 3일 기획전을 준비하는 서면점과 해운대점입니다."],
  [53500, "배정표의 두 행에서 확인한 매장입니다."],
  [56500, "두 매장의 재고를 확인하면 행사 물량을 조정할지 판단할 수 있습니다."],
] as const;
export const captionAt = (time: number) =>
  cues.findLast((c) => c[0] <= time)![1];
export const storeSelection: Command = {
  type: "select",
  focus: "stores",
  citation: sourceStores,
};
const script: readonly [number, Command][] = [
  [4000, { type: "build" }],
  [8500, { type: "select", focus: "exception", citation: sourceEvent }],
  [15000, { type: "inspect" }],
  [19000, { type: "edit", value: expected.cells[0] }],
  [22200, { type: "approve" }],
  [25000, { type: "page", page: "impact" }],
  [29500, { type: "compare" }],
  [32600, { type: "select", focus: "product", citation: sourceProduct }],
  [34000, { type: "select", focus: "event", citation: sourceEvent }],
  [36500, storeSelection],
  [40600, { type: "update" }],
  [45000, { type: "page", page: "answer" }],
  [47500, { type: "query", value: question }],
  [49200, { type: "ask" }],
  [53500, { type: "cite", citation: sourceStores }],
];
const frames = script.reduce<{ time: number; work: Work }[]>(
  (list, [time, command]) => {
    list.push({
      time,
      work: apply(list.at(-1)?.work ?? initialWork(), command),
    });
    return list;
  },
  [],
);
export function workAt(time: number, reduced = false) {
  const work = frames.findLast((f) => f.time <= time)?.work ?? initialWork();
  return time >= 45000 && time < 47500
    ? apply(work, {
        type: "query",
        value: reduced
          ? question
          : question.slice(
              0,
              Math.floor(((time - 45000) / 2500) * question.length),
            ),
      })
    : work;
}

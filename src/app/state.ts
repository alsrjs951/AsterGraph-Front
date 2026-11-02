import { analyze } from "../mocks/analysis";
import { QUESTION, seed } from "../mocks/seed";
import type { AnalysisResult } from "../mocks/types";
export type Page = "overview" | "operations" | "ontology" | "sources" | "end";
export type Filter = "impacted" | "reroutable" | "risk";
export interface WorkspaceState {
  page: Page;
  scenarioActive: boolean;
  query: string;
  status: "idle" | "analyzing" | "done";
  result: AnalysisResult | null;
  selected: string | null;
  filter: Filter;
  orderPage: number;
  plan: boolean;
  view: "orders" | "plan";
  error: string;
  node: string | null;
}
export const initialWorkspace = (): WorkspaceState => ({
  page: "operations",
  scenarioActive: true,
  query: "",
  status: "idle",
  result: null,
  selected: null,
  filter: "impacted",
  orderPage: 0,
  plan: false,
  view: "orders",
  error: "",
  node: null,
});
export type Command =
  | { type: "navigate"; page: Page }
  | { type: "query"; value: string }
  | { type: "analyze" }
  | { type: "complete" }
  | { type: "filter"; filter: Filter; pageSize: number }
  | { type: "select"; id: string }
  | { type: "pagination"; page: number }
  | { type: "plan"; applied: boolean }
  | { type: "view"; view: "orders" | "plan" }
  | { type: "node"; id: string | null };
export function supportedQuestion(value: string) {
  return value.trim().replace(/\s+/g, " ") === QUESTION;
}
export function workspaceReducer(
  s: WorkspaceState,
  action: Command,
): WorkspaceState {
  switch (action.type) {
    case "navigate":
      return { ...s, page: action.page };
    case "query":
      return { ...initialWorkspace(), page: s.page, query: action.value };
    case "analyze":
      return supportedQuestion(s.query)
        ? {
            ...s,
            status: "analyzing",
            error: "",
            result: null,
            plan: false,
            selected: null,
            node: null,
            view: "orders",
          }
        : {
            ...s,
            error: "현재 데모에서는 이 시나리오를 지원합니다",
            status: "idle",
            result: null,
          };
    case "complete": {
      if (s.status !== "analyzing") return s;
      try {
        return {
          ...s,
          status: "done",
          result: analyze(seed),
          orderPage: 0,
          filter: "impacted",
        };
      } catch {
        return {
          ...s,
          status: "idle",
          error: "데모 상태를 다시 불러와 주세요. 리셋 후 다시 분석해 주세요.",
        };
      }
    }
    case "filter": {
      if (!s.result) return s;
      const rows = s.result[action.filter];
      const selected = rows.some((o) => o.id === s.selected)
        ? s.selected
        : (rows[0]?.id ?? null);
      return {
        ...s,
        filter: action.filter,
        selected,
        node: null,
        view: "orders",
        orderPage: Math.max(
          0,
          Math.floor(
            rows.findIndex((o) => o.id === selected) / action.pageSize,
          ),
        ),
      };
    }
    case "select":
      return s.result?.evidence[action.id]
        ? { ...s, selected: action.id, node: null }
        : s;
    case "pagination":
      return { ...s, orderPage: action.page };
    case "plan":
      return s.result
        ? {
            ...s,
            plan: action.applied,
            view: action.applied ? "plan" : "orders",
          }
        : s;
    case "view":
      return {
        ...s,
        view: action.view === "plan" && !s.plan ? "orders" : action.view,
      };
    case "node":
      return { ...s, node: action.id };
  }
}

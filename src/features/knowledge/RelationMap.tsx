import { GitBranch } from "lucide-react";
import { impact, type Citation } from "../retail/model";
import {
  approvedResult,
  assignmentsFor,
  candidate,
  expected,
  sourceProduct,
  type Command,
  type Work,
} from "./workflow";

export type WorkProps = { work: Work; send: (command: Command) => void };
export function RelationMap({ work: w, send }: WorkProps) {
  const latest = w.revisions.at(-1);
  const approved = approvedResult(latest);
  const event = approved?.event ?? expected;
  const stores = approved?.stores ?? assignmentsFor(event.cells[0]);
  const picked = w.candidateId === event.cells[0];
  const full = w.built;
  const middle = w.built;
  const select = (focus: string, citation: Citation) =>
    send({ type: "select", focus, citation });
  const status = latest ? "승인 관계" : picked ? "수정 후보" : "검수 대기";
  const trace =
    w.page === "impact" && ["event", "stores", "version"].includes(w.focus);
  function node(
    x: number,
    y: number,
    key: string,
    label: string,
    id: string,
    onClick: () => void,
    group?: string,
  ) {
    const selected =
      w.focus === key ||
      Boolean(group && w.focus === group) ||
      (w.focus === "edge" && key === (picked ? "event" : "draft"));
    return (
      <button
        key={id}
        className={"kg-node " + (selected ? "kg-selected" : "")}
        style={{ left: x + "%", top: y + "%" }}
        aria-pressed={selected}
        onClick={onClick}
      >
        <small>
          {label}
          {selected ? " · 선택" : ""}
        </small>
        <strong>{id}</strong>
        {key === "product" && w.page === "impact" && (
          <em>
            {impact.latest.cells[1].slice(5).replace("-", ".")} · 납품 중단 공지
          </em>
        )}
      </button>
    );
  }
  const yEvent = latest ? 50 : 27;
  const openEdge = () =>
    latest
      ? select("event", { source: "events", rows: [event.row] })
      : send({ type: "inspect" });
  const path = "M 16 50 L 50 " + (picked ? yEvent : 75);
  const storesTraced =
    w.page === "impact" &&
    (w.focus === "stores" ||
      w.focus === "version" ||
      w.focus.startsWith("store-"));
  return (
    <section className="kg-graph" aria-label="상품 행사 매장 관계">
      <div className="kg-graph-cap">
        <span>
          <GitBranch size={15} /> 상품 · 행사 · 매장
        </span>
        <b>{latest ? "승인본 v" + latest.version : "AI 추출 초안 · 시연용"}</b>
      </div>
      <div className="kg-canvas">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {middle && (
            <path
              className={
                latest ? (trace ? "kg-trace" : "kg-solid") : "kg-pending"
              }
              d={path}
            />
          )}
          {full &&
            stores.map((s, i) => (
              <path
                key={s.row}
                className={storesTraced ? "kg-trace" : "kg-solid"}
                d={
                  "M 50 " +
                  yEvent +
                  " L 84 " +
                  (100 * (i + 0.5)) / stores.length
                }
              />
            ))}
          {middle && (
            <path d={path} className="kg-edge-hit" onClick={openEdge} />
          )}
        </svg>
        {!middle && (
          <div className="kg-await" style={{ left: "50%" }}>
            행사 계획 대조 전
          </div>
        )}
        {!full && (
          <div className="kg-await" style={{ left: "84%" }}>
            매장 배정 대조 전
          </div>
        )}
        {node(16, 50, "product", "상품 · " + impact.id, impact.name, () =>
          select("product", sourceProduct),
        )}
        {middle &&
          node(
            50,
            yEvent,
            "event",
            "행사 · " + event.cells[0],
            event.cells[1],
            () => select("event", { source: "events", rows: [event.row] }),
          )}
        {middle &&
          !latest &&
          node(
            50,
            75,
            "draft",
            "행사 · " + candidate.cells[0],
            candidate.cells[1],
            () => send({ type: "inspect" }),
          )}
        {full &&
          stores.map((s, i) =>
            node(
              84,
              (100 * (i + 0.5)) / stores.length,
              "store-" + s.row,
              "참여 매장",
              s.cells[1],
              () =>
                select("store-" + s.row, { source: "stores", rows: [s.row] }),
              "stores",
            ),
          )}
      </div>
      <div className="kg-graph-foot">
        {middle ? (
          <button onClick={openEdge}>
            <i className={latest ? "solid" : ""} />
            {impact.id} → {latest?.event ?? w.candidateId} <b>{status}</b>
          </button>
        ) : (
          <span>{impact.supplier}의 상품 ID로 행사 계획을 대조합니다.</span>
        )}
        {full && (
          <button
            onClick={() =>
              select("stores", {
                source: "stores",
                rows: stores.map((r) => r.row),
              })
            }
          >
            매장 배정 {stores.length}곳 보기 ↗
          </button>
        )}
      </div>
    </section>
  );
}

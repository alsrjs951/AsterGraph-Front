import { ArrowRight, FileText, Search } from "lucide-react";
import { Button } from "../../components/ui";
import { dossier, impact } from "../retail/model";
import { BatchWorkspace } from "./BatchWorkspace";
import { RelationMap, type WorkProps } from "./RelationMap";
import { approvedResult, question } from "./workflow";

function day(iso: string) {
  const [, month, date] = iso.split("-");
  return Number(month) + "월 " + Number(date) + "일";
}
export function WorkScenes({ work: w, send }: WorkProps) {
  const revision = w.revisions.at(-1);
  const result = approvedResult(revision);
  const v = revision?.version ?? 0;
  const go = (page: "build" | "impact" | "answer") =>
    send({ type: "page", page });
  const graph = <RelationMap work={w} send={send} />;
  if (w.page === "build" || w.page === "review")
    return <BatchWorkspace work={w} send={send} />;
  if (!revision || (w.page === "answer" && v < 2))
    return (
      <article className="panel rt-card kg-card">
        <div className="kg-eyebrow">승인 이력 확인</div>
        <h2>
          {v ? "변경된 납품 상태를 확인하세요" : "행사 연결을 먼저 검수하세요"}
        </h2>
        <p className="kg-lead">
          {v
            ? "납품 변경의 원문과 영향 대상을 확인하고 v2에 반영하면 답변을 조회할 수 있습니다."
            : "준비 자료를 한 번에 구축하고 검수함에서 원문을 확인한 뒤 묶음을 승인하세요."}
        </p>
        <div>
          <Button onClick={() => go(v ? "impact" : "build")}>
            {v ? "변경 관리 열기" : "행사 준비로 이동"}
          </Button>
        </div>
      </article>
    );
  if (w.page === "impact" && result) {
    const before = w.revisions[0];
    return (
      <article className="panel rt-card kg-card">
        <div className="kg-eyebrow">
          <span className="kg-urgent">공급사 공지 도착</span>{" "}
          {day(impact.latest.cells[1])} · {impact.supplier}
        </div>
        <h2>
          {v === 2
            ? "감귤의 납품 변경을 v2에 반영했습니다"
            : "기획전 하루 전, 감귤 납품이 중단됩니다"}
        </h2>
        <p className="kg-lead">
          {dossier.notice.reason} 승인된 행사 연결을 따라 다시 확인할 업무를
          찾습니다.
        </p>
        <div className="kg-compare">
          <button onClick={() => send({ type: "compare" })}>
            <small>승인본 v1 · 기존 상태</small>
            <strong>{before.status}</strong>
          </button>
          <ArrowRight size={19} />
          <button
            onClick={() =>
              send({ type: "cite", citation: { source: "notice" } })
            }
          >
            <small>
              {v === 2 ? "변경본 v2" : "접수된 변경"} · {impact.latest.cells[1]}
            </small>
            <strong>{impact.latest.cells[2]}</strong>
          </button>
          <button className="kg-mini" onClick={() => send({ type: "compare" })}>
            변경 기록 대조 ↗
          </button>
        </div>
        {graph}
        <div className="kg-strip">
          <span>
            <b>{w.traced ? "영향 대조 완료" : "재검토 대상"}</b> 행사 1건 · 매장{" "}
            {result.stores.length}곳
          </span>
          {v === 2 ? (
            <Button onClick={() => go("answer")}>
              승인본으로 질문 <ArrowRight size={16} />
            </Button>
          ) : !w.comparing ? (
            <Button onClick={() => send({ type: "compare" })}>
              변경 1건 검토
            </Button>
          ) : (
            <Button variant="primary" onClick={() => send({ type: "update" })}>
              변경 승인 · v2
            </Button>
          )}
        </div>
      </article>
    );
  }
  if (!result) return null;
  const { event, stores } = result;
  const names = stores.map((s) => s.cells[1]).join(" · ");
  return (
    <article className="panel rt-card kg-card kg-qa">
      <div className="kg-eyebrow">
        <span>구매 운영 질의</span> 승인본 v{v} · 로컬 자료 조회
      </div>
      <h2>행사 전에 어디부터 확인할까요?</h2>
      <form
        className="kg-form"
        onSubmit={(e) => {
          e.preventDefault();
          send({ type: "ask" });
        }}
      >
        <Search size={19} />
        <input
          aria-label="업무 질문"
          placeholder={question}
          value={w.query}
          onChange={(e) => send({ type: "query", value: e.target.value })}
        />
        <Button variant="primary" type="submit">
          조회
        </Button>
      </form>
      {w.answer === "found" ? (
        <>
          <section className="kg-result">
            <small>승인본 답변 · v{v}</small>
            <h3>
              {day(event.cells[3])} {event.cells[1]} · {names}
            </h3>
            <p>
              {impact.name}({revision.product})은 {event.cells[0]}의 대상
              상품입니다. 행사 기간은 {day(event.cells[3])}부터{" "}
              {day(event.cells[4])}까지이며, 배정표에는 참여 매장{" "}
              {stores.length}곳이 기록돼 있습니다.
            </p>
            <div className="kg-cites">
              <button
                onClick={() =>
                  send({
                    type: "cite",
                    citation: { source: "events", rows: [event.row] },
                  })
                }
              >
                <FileText size={15} /> 행사 계획 {event.row}행
              </button>
              <button
                aria-pressed={w.citation.source === "stores"}
                onClick={() =>
                  send({
                    type: "cite",
                    citation: {
                      source: "stores",
                      rows: stores.map((r) => r.row),
                    },
                  })
                }
              >
                <FileText size={15} /> 매장 배정표{" "}
                {stores.map((r) => r.row).join("·")}행
              </button>
            </div>
          </section>
          <div className="kg-next">
            <small>구매 담당자의 다음 업무</small>
            <strong>
              {stores.length === 2 ? "두 매장" : names}의 재고 확인 후 행사 물량
              조정 검토
            </strong>
          </div>
        </>
      ) : (
        <div className="kg-suggestion">
          <small>
            {w.answer === "unsupported"
              ? "이 시연에서 조회할 수 있는 질문"
              : "추천 질문"}
          </small>
          <button onClick={() => send({ type: "query", value: question })}>
            {question} ↗
          </button>
        </div>
      )}
    </article>
  );
}

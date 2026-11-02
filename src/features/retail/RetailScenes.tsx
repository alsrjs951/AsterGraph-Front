import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  FileText,
  GitBranch,
  ClipboardList,
  Search,
} from "lucide-react";
import { Button } from "../../components/ui";
import {
  citationRows,
  handoffNote,
  dossier,
  impact as r,
  question,
  type Citation,
  type Source,
} from "./model";
import { RelationGraph } from "./RelationGraph";
import type { Interaction, View } from "./story";
import { Catalog } from "./Catalog";
import type { ReactNode } from "react";
type Props = {
  view: View;
  send: (a: Interaction) => void;
  reviewStrip?: ReactNode;
};
const period = (start: string, end: string) => start + " — " + end;

export function Evidence({
  citation,
  onInteract,
  reviewAction,
}: {
  citation: Citation;
  onInteract: () => void;
  reviewAction?: ReactNode;
}) {
  const { source } = citation;
  const doc = dossier[source];
  const table = source === "notice" ? null : dossier[source];
  const rows = citation.rows ?? citationRows(source);
  const locator = table
    ? [
        source === "events" ? dossier.events.sheet + " 시트" : "CSV",
        rows.length ? rows.join("·") + "행" : "해당 행 없음",
      ].join(" / ")
    : "PDF / 1페이지";
  return (
    <aside className="panel rt-evidence" aria-label="원문 근거">
      <div className="rt-evidence-title">
        <FileText size={19} />
        <h2>원문 근거</h2>
      </div>
      <div className="rt-evidence-body">
        <span className="rt-kicker">SOURCE DOCUMENT</span>
        <h3>{doc.file}</h3>
        <span className="rt-locator">{locator}</span>
        {table ? (
          rows.map((row) => (
            <section key={row} className="rt-record">
              <span className="rt-kicker">
                ROW {String(row).padStart(2, "0")}
              </span>
              <dl>
                {table.headers.map((header, i) => (
                  <div key={header}>
                    <dt>{header}</dt>
                    <dd>{table.rows[row - 2][i]}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))
        ) : (
          <section className="rt-record">
            <span className="rt-kicker">{dossier.notice.id}</span>
            <h3>{r.latest.cells[2]} 안내</h3>
            <dl>
              {[
                ["발신", r.supplier],
                ["대상", r.id + " · " + r.name],
                ["적용일", r.latest.cells[1]],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            <p>{dossier.notice.reason}</p>
          </section>
        )}
      </div>
      {reviewAction}
      <a
        className="button secondary"
        href={"/retail/" + doc.file}
        target="_blank"
        rel="noreferrer"
        onClick={onInteract}
      >
        {source === "notice" ? "원본 PDF 열기" : "원본 파일 열기"}
        <ArrowUpRight size={17} />
      </a>
    </aside>
  );
}
function Totals() {
  return (
    <div className="rt-totals">
      {[
        ["상품", "1", "개"],
        ["재검토 행사", r.events.length, "건"],
        ["참여 매장", r.stores.length, "곳"],
      ].map(([label, count, unit]) => (
        <div key={label}>
          <small>{label}</small>
          <strong>
            {count}
            <span>{unit}</span>
          </strong>
        </div>
      ))}
    </div>
  );
}
export function RetailScenes({ view, send, reviewStrip }: Props) {
  const { scene } = view;
  const open = (scene: number) => send({ type: "open", scene });
  const cite = (source: Source) => send({ type: "cite", citation: { source } });
  if (scene === 0)
    return (
      <article className="panel rt-card rt-notice">
        <div className="rt-band">
          <span className="rt-kicker">SUPPLIER BULLETIN</span>
          <span className="rt-alert">
            <i />
            신규 공지
          </span>
        </div>
        <div className="rt-notice-main">
          <span className="rt-eyebrow">
            {r.supplier} &nbsp; / &nbsp; 구매 운영팀 수신
          </span>
          <h2>
            {r.name}
            <br />
            <em>{r.latest.cells[2]}</em> 안내
          </h2>
          <p>{dossier.notice.reason}</p>
          <dl className="rt-facts">
            <div>
              <dt>대상 상품</dt>
              <dd>{r.id}</dd>
            </div>
            <div>
              <dt>적용일</dt>
              <dd>{r.latest.cells[1]}</dd>
            </div>
          </dl>
        </div>
        {reviewStrip}
        <div className="rt-action">
          <span>구매운영팀 · 납품 일정 확인</span>
          <Button variant="primary" onClick={() => open(1)}>
            납품 변경 확인
            <ArrowRight size={16} />
          </Button>
        </div>
      </article>
    );
  if (scene === 4)
    return (
      <Catalog
        state={view.catalog}
        update={(patch) => send({ type: "catalog", patch })}
        citation={view.citation}
        select={(citation) => send({ type: "cite", citation })}
        next={() => open(5)}
      />
    );
  if (scene === 1)
    return (
      <article className="panel rt-card">
        <div className="rt-section-title">
          <span className="rt-kicker">CHANGE REVIEW</span>
          <h2>{r.name} 납품 상태 변경</h2>
          <p>
            {r.id} · {dossier.notice.reason}
          </p>
        </div>
        <div className="rt-diff">
          {[r.before, r.latest].map((item, i) => (
            <button
              key={item.row}
              className={i ? "rt-new" : ""}
              onClick={() =>
                send({
                  type: "cite",
                  citation: { source: "changes", rows: [item.row] },
                })
              }
            >
              <small>{i ? "최신 기록 · 적용일" : "이전 기록 · 기준일"}</small>
              <strong>{item.cells[2]}</strong>
              <span>{item.cells[1]}</span>
            </button>
          ))}
          <ArrowRight className="rt-diff-arrow" size={22} />
        </div>
        <section className="rt-case-question">
          <small>구매운영팀의 확인 사항</small>
          <h3>중단일 이후, 이 상품이 필요한 행사가 있나요?</h3>
          <p>행사 계획에서 대상 상품 {r.id}와 진행 기간을 대조합니다.</p>
        </section>
        {reviewStrip}
        <div className="rt-action">
          <button
            className="text-button"
            onClick={() => send({ type: "ledger", value: !view.ledger })}
          >
            {view.ledger ? "비교 근거 보기" : "변경 이력 보기"}
          </button>
          <button className="text-button" onClick={() => cite("notice")}>
            공급사 공지 확인
          </button>
          <Button variant="primary" onClick={() => open(2)}>
            관련 행사 찾기
            <Search size={17} />
          </Button>
        </div>
      </article>
    );
  if (scene === 3)
    return (
      <article className="panel rt-card rt-map-card">
        <div className="rt-section-title">
          <span className="rt-kicker">행사 운영 / 참여 매장</span>
          <h2>어느 매장이 행사를 준비하고 있나요?</h2>
          <p>{r.id}에서 출발해 행사와 매장 사이의 배정 관계를 따라갑니다.</p>
        </div>
        <RelationGraph view={view} send={send} />
        <div className="rt-action">
          <span>선택한 관계의 출처는 오른쪽에서 확인할 수 있습니다.</span>
          <Button onClick={() => send({ type: "verify" })}>
            매장 배정표 대조
            <ArrowRight size={16} />
          </Button>
        </div>
      </article>
    );
  if (scene === 5)
    return (
      <article className="panel rt-card rt-handoff">
        <div className="rt-section-title">
          <span className="rt-kicker">
            <ClipboardList size={16} /> 구매운영팀 / 검토 메모
          </span>
          <h2>행사 시작 전 확인할 일</h2>
          <p>
            {r.latest.cells[1]} 납품 변경 · {r.name} ({r.id})
          </p>
        </div>
        <Totals />
        <div className="rt-findings">
          <h3>확인한 사실</h3>
          {r.events.map(({ cells: [id, name, , start, end] }) => (
            <p key={id}>
              <strong>
                {name} · {id}
              </strong>
              <br />
              {period(start, end)}
              <br />
              참여 매장　
              {r.assignments
                .filter((a) => a.cells[0] === id)
                .map((a) => a.cells[1])
                .join(" · ")}
            </p>
          ))}
        </div>
        <div className="rt-case-question">
          <small>다음 조치 · 구매운영팀</small>
          <p className="rt-closing">{handoffNote}</p>
        </div>
        {reviewStrip}
      </article>
    );
  return (
    <article className="panel rt-card">
      <div className="rt-section-title">
        <span className="rt-kicker">EVIDENCE SEARCH</span>
        <h2>납품 중단 이후의 행사 찾기</h2>
        <p>
          {r.name} · 상품 {r.id} · 중단 적용일 {r.latest.cells[1]}
        </p>
      </div>
      <form
        className="rt-search"
        onSubmit={(e) => {
          e.preventDefault();
          send({ type: "submit" });
        }}
      >
        <label htmlFor="retail-query">업무 질문</label>
        <div>
          <input
            id="retail-query"
            value={view.query}
            placeholder="확인할 질문을 입력하세요"
            onChange={(e) => send({ type: "query", value: e.target.value })}
          />
          <Button variant="primary" type="submit">
            <Search size={17} />
            검색
          </Button>
        </div>
        {view.answer !== "found" && (
          <button
            type="button"
            className="text-button"
            onClick={() => send({ type: "query", value: question })}
          >
            추천 질문 · {question}
          </button>
        )}
      </form>
      {view.answer === "unsupported" && (
        <p className="rt-answer" role="status">
          이 시연에서는 위 추천 질문을 조회할 수 있습니다.
        </p>
      )}
      {view.answer === "found" && (
        <section className="rt-answer" aria-label="조회 답변">
          <span className="rt-kicker">
            <Check size={15} /> 조회 결과
          </span>
          <h3>관련 행사 {r.events.length}건을 찾았습니다.</h3>
          {r.events.map(({ cells: [id, name, , start, end] }) => (
            <div key={id}>
              <strong>
                <CalendarDays size={17} />
                {name} · {id}
              </strong>
              <p>{period(start, end)}</p>
              {view.citation.source === "stores" && (
                <p>
                  {r.assignments
                    .filter((a) => a.cells[0] === id)
                    .map((a) => a.cells[1])
                    .join(" · ")}
                </p>
              )}
            </div>
          ))}
          <div className="rt-cites">
            <button
              aria-pressed={view.citation.source === "events"}
              onClick={() => cite("events")}
            >
              [1] {dossier.events.file}
            </button>
            <button
              aria-pressed={view.citation.source === "stores"}
              onClick={() => cite("stores")}
            >
              [2] {dossier.stores.file}
            </button>
          </div>
        </section>
      )}
      <div className="rt-action">
        <span>지정 질문 · 로컬 자료 조회</span>
        <Button onClick={() => open(3)}>
          참여 매장 추적
          <GitBranch size={16} />
        </Button>
      </div>
    </article>
  );
}

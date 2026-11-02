import { useState } from "react";
import { BatchLedger } from "./BatchLedger";
import {
  Check,
  FileStack,
  ArrowRight,
  ShieldCheck,
  GitPullRequest,
} from "lucide-react";
import { Button } from "../../components/ui";
import { dossier, impact } from "../retail/model";
import {
  batch,
  batchSources,
  exception,
  kinds,
  unresolved,
  type BatchSource,
} from "./batch";
import { candidate, expected, sourceEvent } from "./workflow";
import { RelationMap, type WorkProps } from "./RelationMap";

const byKind = kinds.map((kind) =>
  [...batch.entities.values()].filter((entity) => entity.kind === kind),
);
const points = new Map<string, { x: number; y: number }>();
byKind.forEach((entities, column) =>
  entities.forEach((entity, i) => {
    const angle = i * 2.399963;
    const radius = Math.sqrt((i + 0.5) / entities.length);
    points.set(entity.id, {
      x: 95 + column * 190 + Math.cos(angle) * radius * 68,
      y: 84 + Math.sin(angle) * radius * 62,
    });
  }),
);
function line(from: string, to: string) {
  const a = points.get(from),
    b = points.get(to);
  return a && b
    ? "M" +
        a.x.toFixed(1) +
        " " +
        a.y.toFixed(1) +
        "L" +
        b.x.toFixed(1) +
        " " +
        b.y.toFixed(1)
    : "";
}
const connections = batch.links
  .filter((l) => l.valid)
  .map((l) => line(l.from, l.to))
  .join("");
const captions = ["공급", "대상 상품", "참여"];
const sourceForKind: BatchSource[] = [
  "products",
  "products",
  "events",
  "stores",
];
const checks = batch.links.length - batch.exceptions.length;
const fileLabels = ["상품·공급사", "행사·대상 상품", "행사·참여 매장"];
function BatchMap({
  work: w,
  send,
  openLedger,
}: WorkProps & { openLedger: () => void }) {
  const approved = Boolean(w.revisions.length);
  const corrected = w.candidateId === expected.cells[0];
  const highlighted = w.focus === "exception";
  return (
    <section className="batch-atlas" aria-label="전체 지식그래프">
      <div className="batch-atlas-head">
        <strong>구매 운영 온톨로지</strong>
        <span>
          개체 {batch.entities.size}개 · 관계 {batch.links.length}개
        </span>
      </div>
      <div className="batch-schema">
        {kinds.map((kind, i) => (
          <div key={kind}>
            <button
              onClick={() =>
                send({
                  type: "cite",
                  citation: { source: sourceForKind[i], rows: [2] },
                })
              }
            >
              {kind} <b>{byKind[i].length}</b>
            </button>
            {captions[i] && <small>{captions[i]} →</small>}
          </div>
        ))}
      </div>
      <svg
        className="batch-network"
        viewBox="0 0 760 168"
        role="img"
        aria-label="네 유형별 개체와 문서에서 추출한 관계 후보 전체"
      >
        <path d={connections} className="batch-links" />
        {byKind.map((entities, column) => (
          <g key={column} className={"batch-dots batch-col-" + column}>
            {entities.map((entity) => {
              const pt = points.get(entity.id)!;
              return (
                <circle
                  key={entity.id}
                  cx={pt.x}
                  cy={pt.y}
                  r={column === 1 ? 1.65 : 2.65}
                />
              );
            })}
          </g>
        ))}
        <path
          className={corrected ? "batch-fixed" : "batch-mismatch"}
          d={line(
            exception.from,
            corrected ? exception.expected : exception.to,
          )}
        />
      </svg>
      <div className="batch-legend">
        <span>{approved ? "담당자 승인 완료" : "AI 추출 초안 · 시연용"}</span>
        <button onClick={openLedger}>전체 대조 내역</button>
        <button
          className={highlighted ? "is-highlighted" : ""}
          onClick={() => send({ type: "inspect" })}
        >
          {approved
            ? "검수 근거 보기"
            : checks +
              "건 일치 · 예외 " +
              batch.exceptions.length +
              "건 보기"}{" "}
          ↗
        </button>
      </div>
    </section>
  );
}
export function BatchWorkspace({ work: w, send }: WorkProps) {
  const [ledger, setLedger] = useState(false);
  const openLedger = () => {
    send({ type: "cite", citation: w.citation });
    setLedger(true);
  };
  const revision = w.revisions[0];
  const review = w.page === "review" && w.built;
  const corrected = w.candidateId === expected.cells[0];
  const remaining = unresolved(w.candidateId).length;
  const inspect = () => send({ type: "inspect" });
  return (
    <article className="panel rt-card kg-card batch-card">
      <div className="kg-eyebrow">
        <span>{review ? "담당자 검수" : "기업 문서 일괄 구축"}</span> 구매운영팀
        · 11월 행사 준비
      </div>
      <h2>
        {review
          ? revision
            ? "검수한 묶음을 v1으로 승인했습니다"
            : "원문과 다른 연결만 확인하세요"
          : w.built
            ? "준비 자료가 하나의 그래프로 연결됐습니다"
            : "내일 시작할 감귤 기획전, 예정대로 준비해도 될까요?"}
      </h2>
      <p className="kg-lead">
        {review
          ? revision
            ? "이 승인본을 기준으로 새 공지가 들어오면 바뀐 부분을 찾습니다."
            : "자동 대조 결과와 보정 제안을 확인한 뒤 담당자가 묶음 전체를 승인합니다."
          : w.built
            ? w.focus === "exception"
              ? impact.id +
                "의 행사 연결이 원문과 다릅니다. 검수함에 해당 행과 보정 제안을 준비했습니다."
              : "서로 다른 문서의 ID로 연결을 찾고, 각 관계에 원본 행을 붙였습니다."
            : "상품 목록, 행사 계획, 매장 배정표를 한 묶음으로 불러와 행사 준비에 사용합니다."}
      </p>
      {!w.built ? (
        <section className="batch-inbox">
          <div className="batch-atlas-head">
            <strong>
              <FileStack size={19} /> 행사 준비 자료 묶음
            </strong>
            <span>등록된 원본 {batchSources.length}개</span>
          </div>
          {batchSources.map((source, i) => (
            <button
              className="batch-file"
              key={source}
              onClick={() =>
                send({ type: "cite", citation: { source, rows: [2] } })
              }
            >
              <small>
                {dossier[source].file.endsWith("csv") ? "CSV" : "XLSX"}
              </small>
              <span>
                <b>{dossier[source].file}</b>
                <small>{fileLabels[i]}</small>
              </span>
              <em>{dossier[source].rows.length}행</em>
            </button>
          ))}
        </section>
      ) : review ? (
        <>
          <div className="batch-verdict">
            <ShieldCheck size={22} />
            <button onClick={openLedger}>
              원본 ID 자동 대조 <b>{checks}건 일치 ↗</b>
            </button>
            <span>
              검수 예외{" "}
              <b>
                {revision || corrected
                  ? "보정 완료"
                  : batch.exceptions.length + "건"}
              </b>
            </span>
          </div>
          {revision ? (
            <RelationMap work={w} send={send} />
          ) : (
            <section className="batch-exception">
              <div className="batch-atlas-head">
                <strong>
                  <GitPullRequest size={16} /> 대상 행사 불일치
                </strong>
                <button
                  onClick={() => send({ type: "cite", citation: sourceEvent })}
                >
                  행사 계획 {expected.row}행 ↗
                </button>
              </div>
              <div className="batch-diff">
                <div>
                  <small>추출 초안</small>
                  <strong>{candidate.cells[0]}</strong>
                  <span>{candidate.cells[1]}</span>
                </div>
                <ArrowRight />
                <div>
                  <small>{corrected ? "적용한 값" : "원문 기반 제안"}</small>
                  <strong>{expected.cells[0]}</strong>
                  <span>{expected.cells[1]}</span>
                </div>
              </div>
              <p>
                {impact.name}의 상품 ID <b>{impact.id}</b>가 원문의 대상 상품과
                일치합니다.
              </p>
            </section>
          )}
        </>
      ) : (
        <BatchMap work={w} send={send} openLedger={openLedger} />
      )}
      <div className="kg-strip batch-action">
        <span>
          {revision ? (
            <>
              <b>담당자 승인 · v1</b> 관계 {revision.reviewedLinks}개
            </>
          ) : !w.built ? (
            <>
              <b>{batch.links.length}행 준비됨</b> 원본 위치 보존
            </>
          ) : !review ? (
            <>
              <b>승인 대기</b> 담당자 검수 후 업무에 반영
            </>
          ) : corrected ? (
            <>
              <b>미해결 {remaining}건</b> 최종 승인 대기
            </>
          ) : (
            <>
              <b>검수 중</b> 원문과 제안 대조
            </>
          )}
        </span>
        {!w.built ? (
          <Button variant="primary" onClick={() => send({ type: "build" })}>
            묶음으로 구축 <ArrowRight size={16} />
          </Button>
        ) : revision ? (
          <Button onClick={() => send({ type: "page", page: "impact" })}>
            변경 관리 열기 <ArrowRight size={16} />
          </Button>
        ) : !review || !w.inspecting ? (
          <Button variant="primary" onClick={inspect}>
            예외 검수 열기 <ArrowRight size={16} />
          </Button>
        ) : (
          <>
            {!corrected && (
              <Button
                onClick={() => send({ type: "edit", value: expected.cells[0] })}
              >
                제안 적용 · {expected.cells[0]}
              </Button>
            )}
            <Button
              variant="primary"
              disabled={remaining > 0}
              onClick={() => send({ type: "approve" })}
            >
              <Check size={16} /> 묶음 승인 · v1
            </Button>
          </>
        )}
      </div>
      {ledger && (
        <BatchLedger
          corrected={corrected}
          close={() => setLedger(false)}
          openSource={(citation) => send({ type: "cite", citation })}
        />
      )}
    </article>
  );
}

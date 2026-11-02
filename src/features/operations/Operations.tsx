import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  GitBranch,
  Layers3,
  Package,
  Search,
  Truck,
  Warehouse,
  Info,
  ListFilter,
  RotateCcw,
  Boxes,
  FileText,
} from "lucide-react";
import type { Command, Filter, WorkspaceState } from "../../app/state";
import { QUESTION, SCENARIO, sources } from "../../mocks/seed";
import type { OrderEvidence } from "../../mocks/types";
import { Button } from "../../components/ui";
export type SendCommand = (command: Command) => void;
const filterNames: Record<Filter, string> = {
  impacted: "전체 영향",
  reroutable: "대체 출고",
  risk: "우선 대응",
};
const resultTitles: Record<Filter, string> = {
  impacted: "영향 주문",
  reroutable: "대체 출고 대상",
  risk: "우선 대응 주문",
};
const relationLabels: Record<string, string> = {
  storedAt: "보관 위치",
  stockOf: "재고 상품",
  referencesProduct: "상품 참조",
  containsItem: "주문 구성",
};
export function Operations({
  state: s,
  send,
  pageSize,
  showAssumptions,
  connection,
}: {
  state: WorkspaceState;
  send: SendCommand;
  pageSize: number;
  showAssumptions: () => void;
  connection: boolean;
}) {
  const result = s.result;
  const evidence = s.selected ? result?.evidence[s.selected] : undefined;
  return (
    <div className="operations-grid" data-testid="operations">
      <aside className="scenario panel">
        <div className="scenario-heading">
          <span className="status-dot risk-dot" />
          운영 시나리오
        </div>
        <div className="incident">
          <Warehouse size={25} />
          <h2>부산 물류센터</h2>
          <span className="incident-label">{SCENARIO.hours}시간 운영 중단</span>
        </div>
        <div className="query-heading">
          <label htmlFor="query">운영 질문</label>
          <button
            className="text-button"
            onClick={() => send({ type: "query", value: QUESTION })}
          >
            {s.error ? "추천 질문 사용" : "추천 질문"}
          </button>
        </div>
        <textarea
          id="query"
          value={s.query}
          placeholder="어떤 주문이 영향을 받을까요?"
          onChange={(e) => send({ type: "query", value: e.target.value })}
          aria-describedby={s.error ? "query-error" : "query-hint"}
          aria-invalid={!!s.error}
        />
        <Button
          variant={s.status === "done" ? "secondary" : "primary"}
          onClick={() => send({ type: "analyze" })}
          disabled={!s.query.trim() || s.status === "analyzing"}
          aria-label="영향 분석 실행"
        >
          <Search size={18} />
          {s.status === "analyzing" ? "분석 중…" : "영향 분석"}
        </Button>
        {s.error ? (
          <div id="query-error" className="query-error" role="alert">
            {s.error}
          </div>
        ) : (
          <p id="query-hint" className="query-hint">
            {s.plan
              ? "계획 미리보기 · 원본 데이터 유지"
              : result
                ? "분석 완료 · 주문별 근거를 확인하세요."
                : s.status === "analyzing"
                  ? "주문과 재고 관계를 확인하고 있습니다."
                  : "추천 질문으로 영향 분석을 시작하세요."}
          </p>
        )}
        <div className="scenario-bottom">
          <div className="assumption-summary">
            <span>분석 조건</span>
            <p>
              주문당 상품 1개
              <br />
              목업 재고 기준
            </p>
            <button className="text-button" onClick={showAssumptions}>
              <Info size={15} />
              가정 보기
            </button>
          </div>
          <Button
            variant={s.plan ? "secondary" : "primary"}
            disabled={!result}
            onClick={() =>
              send(
                s.plan
                  ? { type: "view", view: "plan" }
                  : { type: "plan", applied: true },
              )
            }
          >
            <GitBranch size={17} />
            <span>{s.plan ? "계획 비교 보기" : "대응안 시뮬레이션"}</span>
          </Button>
        </div>
      </aside>
      <section className="impact-summary" aria-label="영향 분석 요약">
        {(
          [
            {
              key: "impacted",
              label: "영향 주문",
              detail: "부산 센터 할당 주문",
              icon: Layers3,
            },
            {
              key: "reroutable",
              label: "대체 출고 가능",
              detail: "서울 재고로 대응 가능",
              icon: Truck,
            },
            {
              key: "risk",
              label: "우선 대응 필요",
              detail: "고객 안내 우선 대상",
              icon: CircleAlert,
            },
          ] as const
        ).map(({ key, label, detail, icon: Icon }) => (
          <button
            key={key}
            className={`kpi ${key} ${result && s.filter === key ? "selected" : ""}`}
            disabled={!result}
            aria-pressed={!!result && s.filter === key}
            aria-label={`${label} ${result ? result[key].length : "미분석"}건`}
            title={result ? `${filterNames[key]} 주문 보기` : undefined}
            onClick={() => send({ type: "filter", filter: key, pageSize })}
          >
            <div className="kpi-label">
              <span>{label}</span>
              <Icon size={20} />
            </div>
            <div className="kpi-value" data-testid={`kpi-${key}`}>
              {result ? result[key].length : "—"}
              {result && <span>건</span>}
            </div>
            <span className="kpi-detail">{detail}</span>
            {result && (
              <ListFilter
                className="kpi-filter-icon"
                size={16}
                aria-hidden="true"
              />
            )}
          </button>
        ))}
      </section>
      <section className="results panel" aria-label="분석 결과">
        {!result ? (
          <div className="empty-results">
            <div className="empty-symbol">
              <GitBranch size={32} />
            </div>
            <span className="subtle">연결된 기업 지식에서 시작하는 판단</span>
            <h2>
              {s.status === "analyzing"
                ? "영향을 분석하고 있습니다"
                : "하나의 질문, 연결된 운영 맥락"}
            </h2>
            <p>
              {s.status === "analyzing"
                ? "주문과 재고의 관계를 확인합니다."
                : "질문을 실행하면 영향 주문과\n대응 대상을 확인할 수 있습니다."}
            </p>
            <div className={`system-path ${connection ? "connecting" : ""}`}>
              {sources.map((source, i) => (
                <div key={source.name}>
                  <span>{source.name}</span>
                  <small>
                    {["Order", "Inventory", "Product", "Shipment"][i]}
                  </small>
                </div>
              ))}
            </div>
            <div className="concept-path">
              Order <span>—</span> Product <span>—</span> Inventory{" "}
              <span>—</span> Warehouse
            </div>
            <span className="local-note">
              로컬 시나리오 분석 · 실제 LLM 호출 없음
            </span>
          </div>
        ) : s.view === "plan" ? (
          <PlanPreview state={s} send={send} pageSize={pageSize} />
        ) : (
          <OrderList state={s} send={send} pageSize={pageSize} />
        )}
      </section>
      <EvidencePanel evidence={evidence} selectedNode={s.node} send={send} />
      <div className="sr-only" role="status" aria-live="polite">
        {result
          ? `분석 완료. 영향 주문 ${result.impacted.length}건, 대체 출고 가능 ${result.reroutable.length}건, 우선 대응 ${result.risk.length}건.`
          : ""}
      </div>
    </div>
  );
}
function OrderList({
  state: s,
  send,
  pageSize,
}: {
  state: WorkspaceState;
  send: SendCommand;
  pageSize: number;
}) {
  const result = s.result!;
  const rows = result[s.filter];
  const page = Math.min(
    s.orderPage,
    Math.max(0, Math.ceil(rows.length / pageSize) - 1),
  );
  const start = page * pageSize;
  return (
    <div className="order-list">
      <div className="panel-heading">
        <h2>
          {resultTitles[s.filter]}{" "}
          <span className="result-count">{rows.length}건</span>
        </h2>
        {s.plan ? (
          <button
            className="text-button"
            onClick={() => send({ type: "view", view: "plan" })}
          >
            비교로 돌아가기
            <ArrowRight size={16} />
          </button>
        ) : (
          <span className="subtle">부산 할당 · 출고 대기</span>
        )}
      </div>
      <div className="filters" aria-label="주문 분류">
        {(["impacted", "reroutable", "risk"] as const).map((key) => (
          <button
            key={key}
            onClick={() => send({ type: "filter", filter: key, pageSize })}
            aria-pressed={s.filter === key}
            className={s.filter === key ? "active" : ""}
          >
            {filterNames[key]}
            <span>{result[key].length}</span>
          </button>
        ))}
      </div>
      <table>
        <caption className="sr-only">
          {filterNames[s.filter]} 주문 {rows.length}건
        </caption>
        <thead>
          <tr>
            <th scope="col">주문</th>
            <th scope="col">상품</th>
            <th scope="col">대응 분류</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(start, start + pageSize).map((order) => {
            const possible = result.evidence[order.id].reroutable;
            return (
              <tr
                key={order.id}
                className={s.selected === order.id ? "selected-row" : ""}
                onClick={() => send({ type: "select", id: order.id })}
              >
                <td>
                  <button
                    className="order-id"
                    aria-pressed={s.selected === order.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      send({ type: "select", id: order.id });
                    }}
                  >
                    {order.id}
                    {s.selected === order.id && (
                      <span className="selection-mark" />
                    )}
                  </button>
                </td>
                <td>{order.sku}</td>
                <td>
                  <span
                    className={`order-status ${possible ? "teal" : "coral"}`}
                  >
                    {possible ? <Truck size={15} /> : <CircleAlert size={15} />}
                    <span>{possible ? "대체 가능" : "우선 대응"}</span>
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!rows.length && <p>조건에 맞는 주문이 없습니다.</p>}
      <div className="pagination">
        <span data-testid="list-count">
          {rows.length ? start + 1 : 0}–
          {Math.min(start + pageSize, rows.length)} / {rows.length}건
        </span>
        <div>
          <Button
            variant="quiet"
            aria-label="이전 주문 페이지"
            disabled={page === 0}
            onClick={() => send({ type: "pagination", page: page - 1 })}
          >
            <ChevronLeft size={18} />
          </Button>
          <span>
            {page + 1} / {Math.max(1, Math.ceil(rows.length / pageSize))}
          </span>
          <Button
            variant="quiet"
            aria-label="다음 주문 페이지"
            disabled={start + pageSize >= rows.length}
            onClick={() => send({ type: "pagination", page: page + 1 })}
          >
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}
function PlanPreview({
  state: s,
  send,
  pageSize,
}: {
  state: WorkspaceState;
  send: SendCommand;
  pageSize: number;
}) {
  const r = s.result!;
  return (
    <div className="plan-preview" data-testid="plan-preview">
      <div className="panel-heading">
        <h2>
          <span className="status-dot" />
          시뮬레이션 결과
        </h2>
        <button
          className="text-button"
          onClick={() => send({ type: "view", view: "orders" })}
        >
          <ListFilter size={16} />
          주문 목록
        </button>
      </div>
      <div className="comparison">
        <div>
          <span>
            조치 전<br />
            지연 위험
          </span>
          <strong>
            {r.beforeRisk}
            <small>건</small>
          </strong>
        </div>
        <ArrowRight className="comparison-arrow" size={28} />
        <div>
          <span>
            대체 출고 계획 적용 후<br />
            잔여 지연 위험
          </span>
          <strong className="coral">
            {r.afterRisk}
            <small>건</small>
          </strong>
        </div>
      </div>
      <div
        className="risk-bars"
        role="img"
        aria-label={`조치 전 ${r.beforeRisk}건, 계획 적용 후 잔여 위험 ${r.afterRisk}건. 동일한 영향 주문 기준.`}
      >
        <div>
          <span>조치 전</span>
          <div className="bar-track">
            <i style={{ width: "100%" }} />
          </div>
          <b>{r.beforeRisk}</b>
        </div>
        <div>
          <span>계획 적용 후</span>
          <div className="bar-track">
            <i
              style={{
                width: `${r.beforeRisk ? (r.afterRisk / r.beforeRisk) * 100 : 0}%`,
              }}
            />
          </div>
          <b>{r.afterRisk}</b>
        </div>
      </div>
      <div className="response-groups">
        <div>
          <div>
            <strong>
              <span className="teal">{r.reroutable.length}건</span> 대체 출고
              제안
            </strong>
            <span>
              서울 SKU_A{" "}
              {r.reroutable.reduce(
                (sum, o) => sum + r.evidence[o.id].allocated,
                0,
              )}
              개 배정 가정
            </span>
          </div>
          <Button
            variant="quiet"
            aria-label="대체 출고 대상 보기"
            onClick={() =>
              send({ type: "filter", filter: "reroutable", pageSize })
            }
          >
            대상 보기
            <ArrowRight size={16} />
          </Button>
        </div>
        <div>
          <div>
            <strong>
              <span className="coral">{r.risk.length}건</span> 고객 안내 우선
              대상
            </strong>
            <span>대체 재고가 없는 주문</span>
          </div>
          <Button
            variant="quiet"
            aria-label="우선 대응 대상 보기"
            onClick={() => send({ type: "filter", filter: "risk", pageSize })}
          >
            대상 보기
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>
      <div className="plan-foot">
        <p>48시간 장애·목업 재고 기준의 계획 미리보기입니다.</p>
        <button
          className="text-button"
          onClick={() => send({ type: "plan", applied: false })}
        >
          <RotateCcw size={15} />
          시뮬레이션 해제
        </button>
      </div>
    </div>
  );
}
const nodeIcons = [
  Warehouse,
  Boxes,
  Package,
  FileText,
  Layers3,
  Boxes,
  Warehouse,
];
function EvidencePanel({
  evidence: e,
  selectedNode,
  send,
}: {
  evidence?: OrderEvidence;
  selectedNode: string | null;
  send: SendCommand;
}) {
  const selected = e?.nodes.find((n) => n.id === selectedNode);
  return (
    <section className="evidence panel" aria-label="주문 판단 근거">
      <div className="panel-heading">
        <h2>판단 근거</h2>
        {e ? (
          <span className="order-tag">{e.order.id}</span>
        ) : (
          <GitBranch size={20} className="subtle" />
        )}
      </div>
      {!e ? (
        <div className="evidence-empty">
          <div className="preview-route">
            <i />
            <span />
            <i />
            <span />
            <i />
          </div>
          <h3>결과에는 근거가 있습니다.</h3>
          <p>
            주문을 선택하면 연결 관계와
            <br />
            대체 재고 조건을 확인할 수 있습니다.
          </p>
          <span className="subtle">물류센터 · 재고 · 상품 · 주문</span>
        </div>
      ) : (
        <>
          <div
            className={`evidence-graph ${e.reroutable ? "can-reroute" : "at-risk"}`}
            data-testid="evidence-graph"
          >
            <svg
              viewBox="0 0 400 284"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto-start-reverse"
                >
                  <path d="M0 0 10 5 0 10z" fill="context-stroke" />
                </marker>
              </defs>
              {e.edges.map((edge) => {
                const fromIndex = e.nodes.findIndex(
                  (node) => node.id === edge.from,
                );
                const toIndex = e.nodes.findIndex(
                  (node) => node.id === edge.to,
                );
                const position = (index: number) => ({
                  x: index < 5 ? 104 : 326,
                  y: (index < 5 ? index * 60 : index === 5 ? 60 : 0) + 22,
                });
                const from = position(fromIndex),
                  to = position(toIndex);
                const direction = Math.sign(to.y - from.y);
                const path =
                  from.x === to.x
                    ? `M${from.x} ${from.y + direction * 22}V${to.y - direction * 24}`
                    : `M${from.x} ${from.y + 22}V${to.y}H210`;
                return (
                  <path
                    key={`${edge.from}-${edge.to}`}
                    className={
                      e.nodes[fromIndex].branch ? "branch-edges" : "main-edges"
                    }
                    d={path}
                    markerEnd="url(#arrow)"
                  >
                    <title>{edge.relation}</title>
                  </path>
                );
              })}
            </svg>
            {e.nodes.map((node, i) => {
              const Icon = nodeIcons[i];
              return (
                <button
                  key={node.id}
                  style={{ top: `${i < 5 ? i * 60 : i === 5 ? 60 : 0}px` }}
                  className={`graph-node ${node.branch ? "branch-node" : "main-node"} ${i === 0 ? "outage-node" : ""} ${selectedNode === node.id ? "node-selected" : ""}`}
                  aria-label={`${node.concept}: ${node.label}. ${node.detail}`}
                  aria-pressed={selectedNode === node.id}
                  onClick={() => send({ type: "node", id: node.id })}
                >
                  <Icon size={17} />
                  <span>{node.label}</span>
                </button>
              );
            })}
            {e.edges
              .filter((edge) => {
                const from = e.nodes.find((node) => node.id === edge.from);
                return !from?.branch;
              })
              .map((edge) => {
                const from = e.nodes.findIndex((node) => node.id === edge.from);
                const to = e.nodes.findIndex((node) => node.id === edge.to);
                return (
                  <span
                    key={`${edge.from}-${edge.to}-label`}
                    className="edge-label"
                    style={{ top: `${Math.min(from, to) * 60 + 44}px` }}
                    title={edge.relation}
                  >
                    {relationLabels[edge.relation] ?? edge.relation}
                  </span>
                );
              })}
            <span className="branch-condition">
              {e.order.sku} 일치
              <br />
              {e.reroutable ? "대체 출고 가능" : "대체 재고 없음"}
            </span>
          </div>
          <div
            className={`evidence-verdict ${e.reroutable ? "positive" : "negative"}`}
            data-testid="evidence-verdict"
          >
            <div>
              {e.reroutable ? <Check size={18} /> : <CircleAlert size={18} />}
              <strong>
                {e.reroutable
                  ? `서울 센터에서 ${e.allocated}개 대체 출고 가능`
                  : "고객 안내 우선 대상"}
              </strong>
            </div>
            <p>
              {e.reroutable
                ? e.reason
                : `${e.order.sku} · 서울 가용 ${e.available}개 · 배정 ${e.allocated}개`}
            </p>
          </div>
          <div className="node-detail" aria-live="polite">
            {selected ? (
              <>
                <b>
                  {selected.concept} · {selected.source}
                </b>
                <span>{selected.detail}</span>
                <span>
                  {e.edges
                    .filter(
                      (edge) =>
                        edge.from === selected.id || edge.to === selected.id,
                    )
                    .map((edge) => edge.relation)
                    .join(" / ")}
                </span>
              </>
            ) : (
              <span>노드를 선택하면 관계와 출처를 확인합니다.</span>
            )}
          </div>
          <p className="sr-only">
            부산 센터 → 부산 재고 → {e.order.sku} 상품 → 주문 항목 → 주문{" "}
            {e.order.id}. 서울 가용 재고 {e.available}개. {e.reason}.
          </p>
        </>
      )}
    </section>
  );
}

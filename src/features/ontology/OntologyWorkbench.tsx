import { useId, useState } from "react";
import {
  ArrowRight,
  Search,
  RotateCcw,
  LockKeyhole,
  Database,
  Network,
} from "lucide-react";
import { Button } from "../../components/ui";
import { concepts, relations, sources } from "../../mocks/seed";
import type { Concept } from "../../mocks/types";
import { OntologyGraph } from "./OntologyGraph";
import {
  conceptExample,
  relationLabels,
  relationDescriptions,
} from "./modelPresentation";

export function OntologyWorkbench({ onInteract }: { onInteract?: () => void }) {
  const [selected, setSelected] = useState<Concept>("Inventory");
  const [selectedRelation, setSelectedRelation] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("");
  const [connectedOnly, setConnectedOnly] = useState(false);
  const [showData, setShowData] = useState(false);
  const inputId = useId();
  const concept = concepts.find((c) => c.id === selected)!;
  const connected = relations.filter(
    (r) => r.from === selected || r.to === selected,
  );
  const relation = relations.find((r) => r.name === selectedRelation);
  const matches = concepts.filter(
    (c) =>
      (!source || c.source === source) &&
      `${c.id} ${c.label} ${c.source}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const filtered = !!query.trim() || !!source;
  const select = (id: Concept) => {
    onInteract?.();
    setSelected(id);
    setSelectedRelation(null);
    setShowData(false);
  };
  const selectRelation = (name: string) => {
    onInteract?.();
    setSelectedRelation(name);
    setShowData(false);
  };
  const reset = () => {
    select("Inventory");
    setQuery("");
    setSource("");
    setConnectedOnly(false);
  };
  return (
    <section
      className="ontology-workbench"
      aria-label="기업 온톨로지 탐색 작업대"
    >
      <header className="model-bar">
        <div>
          <Network size={18} />
          <h3>주문·출고 운영 모델</h3>
          <span>
            {concepts.length}개 개념 · {relations.length}개 관계
          </span>
        </div>
        <span className="model-readonly">
          <LockKeyhole size={13} />
          읽기 전용
        </span>
      </header>
      <div className="model-tools">
        <label className="model-search" htmlFor={inputId}>
          <Search size={16} />
          <input
            id={inputId}
            type="search"
            placeholder="개념 또는 시스템 검색"
            aria-label="개념 또는 시스템 검색"
            value={query}
            onChange={(e) => {
              onInteract?.();
              setQuery(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing && matches[0])
                select(matches[0].id);
            }}
          />
        </label>
        <select
          aria-label="원천 시스템 필터"
          value={source}
          onChange={(e) => {
            onInteract?.();
            setSource(e.target.value);
          }}
        >
          <option value="">모든 시스템</option>
          {sources.map((s) => (
            <option key={s.name} value={s.name}>
              {s.name} · {s.label}
            </option>
          ))}
        </select>
        <label className="model-neighbors">
          <input
            type="checkbox"
            checked={connectedOnly}
            onChange={(e) => {
              onInteract?.();
              setConnectedOnly(e.target.checked);
            }}
          />
          선택 개념의 연결 강조
        </label>
        <Button
          variant="quiet"
          onClick={reset}
          aria-label="모델 보기 초기화"
          title="모델 보기 초기화"
        >
          <RotateCcw size={16} />
        </Button>
      </div>
      <div className="model-body">
        <div className="model-canvas">
          <div className="model-canvas-status" role="status">
            {filtered
              ? `${matches.length}개 개념 일치 · 나머지는 흐리게 표시`
              : "개념을 선택하면 연결 관계와 원천 데이터를 확인할 수 있습니다."}
          </div>
          <div className="model-graph-area">
            <OntologyGraph
              selected={selected}
              onSelect={select}
              selectedRelation={selectedRelation}
              onRelationSelect={selectRelation}
              matches={filtered ? new Set(matches.map((c) => c.id)) : undefined}
              connectedOnly={connectedOnly}
            />
            {filtered && matches.length === 0 && (
              <div className="model-empty">
                <Search size={20} />
                <strong>일치하는 개념이 없습니다</strong>
                <p>개념 이름이나 OMS, WMS 같은 시스템 이름으로 검색하세요.</p>
                <Button variant="quiet" onClick={reset}>
                  검색 초기화
                </Button>
              </div>
            )}
          </div>
          <div className="model-legend">
            <span>
              <i />
              선택 개념의 관계
            </span>
            <span>
              <ArrowRight size={15} />
              화살표는 관계의 방향
            </span>
            <span>관계명을 눌러 상세 확인</span>
          </div>
        </div>
        <aside
          className="model-inspector ontology-detail"
          aria-label="선택 항목 상세"
        >
          {relation ? (
            <>
              <div className="inspector-kind">관계 상세</div>
              <h2>{relationLabels[relation.name]}</h2>
              <code className="model-relation-id">{relation.name}</code>
              <div className="model-relation-endpoints">
                <button onClick={() => select(relation.from)}>
                  {concepts.find((c) => c.id === relation.from)!.label}
                  <small>{relation.from}</small>
                </button>
                <ArrowRight size={18} />
                <button onClick={() => select(relation.to)}>
                  {concepts.find((c) => c.id === relation.to)!.label}
                  <small>{relation.to}</small>
                </button>
              </div>
              <p>{relationDescriptions[relation.name]}</p>
              <dl className="model-properties">
                <div>
                  <dt>원천 시스템</dt>
                  <dd>
                    {concepts.find((c) => c.id === relation.from)!.source} →{" "}
                    {concepts.find((c) => c.id === relation.to)!.source}
                  </dd>
                </div>
                <div>
                  <dt>모델 버전</dt>
                  <dd>v1.2 · 데모 모델</dd>
                </div>
              </dl>
            </>
          ) : (
            <>
              <div className="inspector-title">
                <span>{concept.label}</span>
                <span className="model-source-tag">{concept.source}</span>
              </div>
              <h2>{concept.id}</h2>
              <div className="model-detail-switch" aria-label="상세 보기 선택">
                <button
                  aria-pressed={!showData}
                  onClick={() => {
                    onInteract?.();
                    setShowData(false);
                  }}
                >
                  개념 정보
                </button>
                <button
                  aria-pressed={showData}
                  onClick={() => {
                    onInteract?.();
                    setShowData(true);
                  }}
                >
                  데이터 예시
                </button>
              </div>
              {showData ? (
                <>
                  <p className="model-example-note">
                    <Database size={16} />
                    분석에 사용한 로컬 목업 예시
                  </p>
                  <dl className="model-sample">
                    {Object.entries(conceptExample(selected)).map(
                      ([key, value]) => (
                        <div key={key}>
                          <dt>{key}</dt>
                          <dd>{value}</dd>
                        </div>
                      ),
                    )}
                  </dl>
                </>
              ) : (
                <>
                  <p className="foundation-selection">
                    <span>
                      {concept.source} 매핑 · {concept.description}
                    </span>
                  </p>
                  <div className="inspector-section-heading">
                    <h3>연결 관계</h3>
                    <span>{connected.length}</span>
                  </div>
                  <div className="model-relations">
                    {connected.map((r) => (
                      <button
                        key={r.name}
                        onClick={() => selectRelation(r.name)}
                      >
                        <span>
                          {relationLabels[r.name]}
                          <ArrowRight size={14} />
                        </span>
                        <small>
                          {r.from} → {r.to}
                        </small>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </aside>
      </div>
      <footer className="model-statusbar">
        <span>
          <i className="status-dot" />
          Ontology v1.2 · Managed
        </span>
        <span>{sources.map((s) => s.name).join(" / ")} 매핑 · 로컬 목업</span>
      </footer>
    </section>
  );
}

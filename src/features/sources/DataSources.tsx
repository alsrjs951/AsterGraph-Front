import { Database, ArrowRight } from "lucide-react";
import { seed, sources } from "../../mocks/seed";
import { Button } from "../../components/ui";
export function DataSources({ explore }: { explore: () => void }) {
  return (
    <section className="sources-page">
      <div className="source-intro">
        <Database size={26} />
        <div>
          <h2>같은 업무를 가리키는 데이터</h2>
          <p>시스템별 개념을 연결해 주문과 재고를 함께 검토합니다.</p>
        </div>
      </div>
      <div className="source-detail-grid">
        {sources.map((s) => (
          <article className="panel source-detail" key={s.name}>
            <div className="panel-heading">
              <h2>{s.name}</h2>
              <span className="demo-connected">
                <i />
                DEMO CONNECTED
              </span>
            </div>
            <h3>{s.label}</h3>
            <p>{s.description}</p>
            <div className="concept-chips">
              {s.concepts.map((c) => (
                <span key={c}>{c}</span>
              ))}
            </div>
            <div className="source-bottom">
              <span>
                {s.name === "OMS"
                  ? `${seed.orders.length}개 주문`
                  : s.name === "WMS"
                    ? `${new Set(seed.inventories.map((i) => i.warehouseId)).size}개 물류센터`
                    : s.name === "PIM"
                      ? `${new Set(seed.orders.map((o) => o.sku)).size}개 상품`
                      : "주문별 배송 목업"}
              </span>
              <Button variant="quiet" onClick={explore}>
                관계 보기
                <ArrowRight size={16} />
              </Button>
            </div>
          </article>
        ))}
      </div>
      <p className="source-notice">
        모든 소스는 로컬 목업입니다. 실제 기업 시스템과 연결하거나 데이터를
        동기화하지 않습니다.
      </p>
    </section>
  );
}

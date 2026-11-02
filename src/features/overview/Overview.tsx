import {
  ArrowRight,
  CircleAlert,
  Warehouse,
  Boxes,
  Package,
  Truck,
  Layers3,
} from "lucide-react";
import { Button } from "../../components/ui";
import { sources, SCENARIO } from "../../mocks/seed";
const icons = [Layers3, Boxes, Package, Truck];
export function Overview({ open }: { open: () => void }) {
  return (
    <div className="overview-page">
      <section className="incident-overview panel">
        <div className="incident-story">
          <span className="incident-label">
            <CircleAlert size={17} />
            운영 중단 시나리오
          </span>
          <h2>
            부산 물류센터
            <br />
            {SCENARIO.hours}시간 운영 중단
          </h2>
          <p>
            주문은 OMS에, 재고는 WMS에.
            <br />
            흩어진 정보 속에서 영향을 먼저 파악해야 합니다.
          </p>
          <Button variant="primary" onClick={open}>
            영향 분석하기
            <ArrowRight size={18} />
          </Button>
        </div>
        <div className="incident-question">
          <Warehouse size={44} strokeWidth={1.2} />
          <span>LINK MARKET · 이커머스 운영</span>
          <h3>
            어떤 주문이
            <br />
            영향을 받을까?
          </h3>
          <p>
            원인부터 대응 대상까지,
            <br />
            연결된 업무 관계로 확인하세요.
          </p>
        </div>
      </section>
      <div className="source-section-heading">
        <h2>분산된 운영 시스템</h2>
        <span>네 시스템의 맥락을 하나의 판단으로</span>
      </div>
      <div className="system-cards">
        {sources.map((s, i) => {
          const Icon = icons[i];
          return (
            <div className="system-card panel" key={s.name}>
              <Icon size={24} />
              <div>
                <h3>{s.name}</h3>
                <span>{s.label}</span>
              </div>
              <span className="demo-connected">
                <i />
                DEMO CONNECTED
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

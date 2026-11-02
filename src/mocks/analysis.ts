import type { AnalysisResult, OrderEvidence, Seed, SKU } from "./types";
import { SCENARIO } from "./seed";
export function analyze(data: Seed): AnalysisResult {
  const impacted = data.orders
    .filter(
      (o) =>
        o.allocatedWarehouseId === SCENARIO.warehouseId &&
        o.status === "PENDING",
    )
    .sort((a, b) => a.id.localeCompare(b.id));
  const remaining = new Map<SKU, number>();
  for (const i of data.inventories.filter((i) => i.warehouseId === "SEOUL"))
    remaining.set(i.sku, i.available);
  const evidence: Record<string, OrderEvidence> = {};
  for (const order of impacted) {
    const seoul = data.inventories.find(
      (i) => i.warehouseId === "SEOUL" && i.sku === order.sku,
    );
    const busan = data.inventories.find(
      (i) => i.warehouseId === "BUSAN" && i.sku === order.sku,
    );
    if (!seoul || !busan)
      throw new Error("분석에 필요한 재고 관계가 없습니다.");
    const reroutable = (remaining.get(order.sku) ?? 0) >= order.quantity;
    const allocated = reroutable ? order.quantity : 0;
    remaining.set(order.sku, (remaining.get(order.sku) ?? 0) - allocated);
    evidence[order.id] = {
      order,
      available: seoul.available,
      allocated,
      reroutable,
      reason: reroutable
        ? `가용 ${seoul.available}개 중 이 주문 ${allocated}개 배정 가능`
        : "대체 재고가 없어 고객 안내 우선 대상",
      nodes: [
        {
          id: "BUSAN",
          concept: "Warehouse",
          label: "부산 센터",
          detail: `${SCENARIO.hours}시간 운영 중단 가정`,
          source: "WMS",
        },
        {
          id: busan.id,
          concept: "Inventory",
          label: "부산 재고",
          detail: `${order.sku} · 원래 출고 센터`,
          source: "WMS",
        },
        {
          id: order.sku,
          concept: "Product",
          label: order.sku,
          detail: "서울 재고와 동일 SKU 확인",
          source: "PIM",
        },
        {
          id: order.itemId,
          concept: "OrderItem",
          label: `주문 항목 · ${order.quantity}개`,
          detail: `${order.sku} · 동일 납기 판단 구간`,
          source: "OMS",
        },
        {
          id: order.id,
          concept: "Order",
          label: order.id,
          detail: "부산 할당 · PENDING",
          source: "OMS",
        },
        {
          id: seoul.id,
          concept: "Inventory",
          label: `가용 ${seoul.available}개`,
          detail: `${order.sku} · 계획 전 가용 수량`,
          source: "WMS",
          branch: true,
        },
        {
          id: "SEOUL",
          concept: "Warehouse",
          label: "서울 센터",
          detail: reroutable ? "대체 출고 가능 가정" : "해당 SKU 재고 부족",
          source: "WMS",
          branch: true,
        },
      ],
      edges: [
        { from: busan.id, to: "BUSAN", relation: "storedAt" },
        { from: busan.id, to: order.sku, relation: "stockOf" },
        { from: order.itemId, to: order.sku, relation: "referencesProduct" },
        { from: order.id, to: order.itemId, relation: "containsItem" },
        { from: seoul.id, to: order.sku, relation: "stockOf" },
        { from: seoul.id, to: "SEOUL", relation: "storedAt" },
      ],
    };
  }
  const reroutable = impacted.filter((o) => evidence[o.id].reroutable);
  const risk = impacted.filter((o) => !evidence[o.id].reroutable);
  return {
    impacted,
    reroutable,
    risk,
    evidence,
    totalOrders: data.orders.length,
    beforeRisk: impacted.length,
    afterRisk: risk.length,
  };
}

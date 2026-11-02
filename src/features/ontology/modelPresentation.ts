import { seed } from "../../mocks/seed";
import type { Concept } from "../../mocks/types";

export const relationLabels: Record<string, string> = {
  storedAt: "보관 위치",
  stockOf: "재고 상품",
  referencesProduct: "상품 참조",
  containsItem: "주문 구성",
  allocatedFrom: "출고 할당",
  fulfilledBy: "배송 연결",
};
export const relationDescriptions: Record<string, string> = {
  storedAt:
    "재고를 보관하는 물류센터를 연결합니다. 센터 장애가 영향을 주는 재고를 찾는 기준입니다.",
  stockOf:
    "재고가 어떤 상품의 수량인지 연결합니다. 같은 SKU의 대체 재고를 확인하는 기준입니다.",
  referencesProduct:
    "주문 항목이 요청한 상품을 연결합니다. 재고와 주문의 SKU 일치 여부를 확인합니다.",
  containsItem:
    "주문과 그 주문이 요청한 상품 항목을 연결합니다. 이 데모에서는 주문당 항목 1개를 가정합니다.",
  allocatedFrom:
    "주문에 할당된 출고 센터를 연결합니다. 부산 센터에 할당된 출고 대기 주문을 영향 대상으로 식별합니다.",
  fulfilledBy:
    "주문과 배송 목업 정보를 연결합니다. 실제 출고나 배송 상태 변경을 수행하지 않습니다.",
};

// All examples are taken from the same immutable seed used by the analysis.
export function conceptExample(
  concept: Concept,
): Record<string, string | number> {
  const order = seed.orders[0];
  const inventory = seed.inventories[0];
  switch (concept) {
    case "Inventory":
      return { ...inventory };
    case "Order":
      return {
        id: order.id,
        sku: order.sku,
        allocatedWarehouseId: order.allocatedWarehouseId,
        status: order.status,
      };
    case "OrderItem":
      return { id: order.itemId, sku: order.sku, quantity: order.quantity };
    case "Product":
      return { sku: order.sku };
    case "Warehouse":
      return { id: inventory.warehouseId };
    case "Shipment":
      return { id: order.shipmentId, orderId: order.id };
  }
}

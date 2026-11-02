import type { Concept, Inventory, Order, Seed, SKU } from "./types";
export const QUESTION =
  "부산 물류센터가 48시간 중단되면 어떤 주문에 영향이 있나요?";
export const SCENARIO = Object.freeze({
  warehouseId: "BUSAN" as const,
  hours: 48,
});
const skus: SKU[] = ["SKU_A", "SKU_B", "SKU_C"];
const orders: readonly Order[] = Object.freeze(
  Array.from({ length: 120 }, (_, i) =>
    Object.freeze({
      id: `LM-${1001 + i}`,
      sku: i < 26 ? "SKU_A" : i < 38 ? "SKU_B" : skus[i % 3],
      quantity: 1,
      allocatedWarehouseId: i < 38 ? "BUSAN" : "SEOUL",
      status: "PENDING",
      itemId: `ITEM-${1001 + i}`,
      shipmentId: `SHIP-${1001 + i}`,
    } satisfies Order),
  ),
);
const inventories: readonly Inventory[] = Object.freeze(
  [
    { id: "INV-BUSAN-A", warehouseId: "BUSAN", sku: "SKU_A", available: 26 },
    { id: "INV-BUSAN-B", warehouseId: "BUSAN", sku: "SKU_B", available: 12 },
    { id: "INV-BUSAN-C", warehouseId: "BUSAN", sku: "SKU_C", available: 0 },
    { id: "INV-SEOUL-A", warehouseId: "SEOUL", sku: "SKU_A", available: 26 },
    { id: "INV-SEOUL-B", warehouseId: "SEOUL", sku: "SKU_B", available: 0 },
    { id: "INV-SEOUL-C", warehouseId: "SEOUL", sku: "SKU_C", available: 40 },
  ].map((i) => Object.freeze(i as Inventory)),
);
export const seed: Seed = Object.freeze({ orders, inventories });
export const sources = [
  {
    name: "OMS",
    label: "주문 관리",
    description: "주문과 주문 항목의 연결",
    concepts: ["Order", "OrderItem"],
  },
  {
    name: "WMS",
    label: "재고·창고 관리",
    description: "물류센터별 상품 가용 재고",
    concepts: ["Warehouse", "Inventory"],
  },
  {
    name: "PIM",
    label: "상품 정보 관리",
    description: "시스템을 연결하는 상품 기준",
    concepts: ["Product"],
  },
  {
    name: "TMS",
    label: "배송 관리",
    description: "주문에 연결된 배송 정보",
    concepts: ["Shipment"],
  },
] as const;
export const concepts: {
  id: Concept;
  label: string;
  source: string;
  description: string;
}[] = [
  {
    id: "Warehouse",
    label: "물류센터",
    source: "WMS",
    description: "주문의 출고를 담당하고 재고를 보관하는 운영 거점입니다.",
  },
  {
    id: "Inventory",
    label: "재고",
    source: "WMS",
    description:
      "센터와 SKU별 가용 수량입니다. 대체 출고 가능 여부의 판단 근거가 됩니다.",
  },
  {
    id: "Product",
    label: "상품",
    source: "PIM",
    description:
      "재고와 주문 항목이 공통으로 참조하는 상품입니다. 동일 SKU만 배정합니다.",
  },
  {
    id: "OrderItem",
    label: "주문 항목",
    source: "OMS",
    description:
      "주문이 요청한 상품과 수량입니다. 이 데모에서는 주문마다 상품 1개를 가정합니다.",
  },
  {
    id: "Order",
    label: "주문",
    source: "OMS",
    description:
      "출고 센터, 처리 상태, 주문 항목을 포함합니다. 부산 할당 PENDING 주문을 분석합니다.",
  },
  {
    id: "Shipment",
    label: "배송",
    source: "TMS",
    description:
      "주문과 연결된 배송 목업 정보입니다. 실제 배송이나 출고를 실행하지 않습니다.",
  },
];
export const relations: { from: Concept; to: Concept; name: string }[] = [
  { from: "Inventory", to: "Warehouse", name: "storedAt" },
  { from: "Inventory", to: "Product", name: "stockOf" },
  { from: "OrderItem", to: "Product", name: "referencesProduct" },
  { from: "Order", to: "OrderItem", name: "containsItem" },
  { from: "Order", to: "Warehouse", name: "allocatedFrom" },
  { from: "Order", to: "Shipment", name: "fulfilledBy" },
];

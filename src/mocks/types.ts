export type SKU = "SKU_A" | "SKU_B" | "SKU_C";
export type WarehouseId = "BUSAN" | "SEOUL";
export type Concept =
  "Warehouse" | "Inventory" | "Product" | "OrderItem" | "Order" | "Shipment";
export interface Order {
  readonly id: string;
  readonly sku: SKU;
  readonly quantity: number;
  readonly allocatedWarehouseId: WarehouseId;
  readonly status: "PENDING" | "SHIPPED";
  readonly itemId: string;
  readonly shipmentId: string;
}
export interface Inventory {
  readonly id: string;
  readonly warehouseId: WarehouseId;
  readonly sku: SKU;
  readonly available: number;
}
export interface Seed {
  readonly orders: readonly Order[];
  readonly inventories: readonly Inventory[];
}
export interface EvidenceNode {
  id: string;
  concept: Concept;
  label: string;
  detail: string;
  source: string;
  branch?: boolean;
}
export interface EvidenceEdge {
  from: string;
  to: string;
  relation: string;
}
export interface OrderEvidence {
  order: Order;
  available: number;
  allocated: number;
  reroutable: boolean;
  reason: string;
  nodes: EvidenceNode[];
  edges: EvidenceEdge[];
}
export interface AnalysisResult {
  impacted: readonly Order[];
  reroutable: readonly Order[];
  risk: readonly Order[];
  totalOrders: number;
  beforeRisk: number;
  afterRisk: number;
  evidence: Readonly<Record<string, OrderEvidence>>;
}

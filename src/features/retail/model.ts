import dossier from "./dossier.json" with { type: "json" };

export { dossier };
export type Source = keyof typeof dossier;
export const sourceOrder: Source[] = [
  "products",
  "changes",
  "events",
  "stores",
  "notice",
];
export const question = "납품 중단 상품과 관련된 행사는 무엇인가요?";
export const descriptions: Record<Source, string> = {
  products: "상품과 공급사의 기준 정보",
  changes: "날짜별 상품 납품 상태",
  events: "행사별 대상 상품과 진행 기간",
  stores: "행사별 참여 매장",
  notice: "납품 중단 사유와 적용일",
};

function records(rows: string[][]) {
  return rows.map((cells, index) => ({ cells, row: index + 2 }));
}

// Row references retain their original positions even when unrelated records are filtered out.
export function investigate(data = dossier) {
  const product = records(data.products.rows).find(
    (r) => r.cells[0] === data.notice.productId,
  );
  if (!product) throw new Error("공지 상품이 상품 목록에 없습니다.");
  const [id, name, supplier] = product.cells;
  const history = records(data.changes.rows)
    .filter((r) => r.cells[0] === id)
    .sort((a, b) => a.cells[1].localeCompare(b.cells[1]));
  if (history.length < 2) throw new Error("변경 전후 기록이 필요합니다.");
  const [before, latest] = history.slice(-2);
  const events = records(data.events.rows).filter(
    (r) => r.cells[2] === id && r.cells[4] >= latest.cells[1],
  );
  const assignments = records(data.stores.rows).filter((r) =>
    events.some((e) => e.cells[0] === r.cells[0]),
  );
  const stores = [...new Set(assignments.map((r) => r.cells[1]))];
  return {
    id,
    name,
    supplier,
    product,
    before,
    latest,
    events,
    assignments,
    stores,
  };
}
export const impact = investigate();
export const handoffNote = impact.stores.length
  ? impact.stores.join("·") +
    "의 " +
    impact.name +
    " 재고를 확인한 뒤, 행사 물량 조정 여부를 검토합니다."
  : "행사 계획과 매장 배정 여부를 담당자와 확인합니다.";
export type Impact = ReturnType<typeof investigate>;
export type Citation = { source: Source; rows?: number[] };
export function citationRows(source: Source, result = impact): number[] {
  switch (source) {
    case "products":
      return [result.product.row];
    case "changes":
      return [result.before.row, result.latest.row];
    case "events":
      return result.events.map((r) => r.row);
    case "stores":
      return result.assignments.map((r) => r.row);
    case "notice":
      return [];
  }
}

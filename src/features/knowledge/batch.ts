import { dossier, type Citation } from "../retail/model";

export const kinds = ["공급사", "상품", "행사", "매장"] as const;
type Kind = (typeof kinds)[number];
export const batchSources = ["products", "events", "stores"] as const;
export type BatchSource = (typeof batchSources)[number];
export type Entity = { id: string; kind: Kind; label: string };
export type Link = {
  from: string;
  to: string;
  expected: string;
  source: BatchSource;
  row: number;
  valid: boolean;
};
const key = (kind: Kind, id: string) => kind + "/" + id;
export function buildBatch(data = dossier) {
  const entities = new Map<string, Entity>();
  const links: Link[] = [];
  function entity(kind: Kind, id: string, label: string) {
    const k = key(kind, id);
    if (id) entities.set(k, { id: k, kind, label });
    return k;
  }
  for (const [id, name, supplier] of data.products.rows) {
    entity("공급사", supplier, supplier);
    entity("상품", id, name);
  }
  for (const [id, name] of data.events.rows) entity("행사", id, name);
  for (const [, store] of data.stores.rows) entity("매장", store, store);
  function link(
    from: string,
    to: string,
    expected: string,
    source: BatchSource,
    row: number,
  ) {
    links.push({
      from,
      to,
      expected,
      source,
      row,
      valid: entities.has(from) && entities.has(to) && to === expected,
    });
  }
  data.products.rows.forEach(([id, , supplier], i) =>
    link(
      key("공급사", supplier),
      key("상품", id),
      key("상품", id),
      "products",
      i + 2,
    ),
  );
  data.events.rows.forEach(([id, , product], i) => {
    const origin = key("행사", id);
    // One reproducible extraction mistake in the sample proposal.
    const draft =
      product === data.notice.productId ? key("행사", "E-08") : origin;
    link(key("상품", product), draft, origin, "events", i + 2);
  });
  data.stores.rows.forEach(([id, store], i) =>
    link(
      key("행사", id),
      key("매장", store),
      key("매장", store),
      "stores",
      i + 2,
    ),
  );
  return { entities, links, exceptions: links.filter((l) => !l.valid) };
}
export const batch = buildBatch();
export const exception = batch.exceptions.find(
  (l) =>
    l.source === "events" && l.from === key("상품", dossier.notice.productId),
)!;
export const rowCitation = (link: Link): Citation => ({
  source: link.source,
  rows: [link.row],
});
export function unresolved(eventId: string) {
  return batch.exceptions.filter(
    (l) =>
      l !== exception ||
      key("행사", eventId) !== l.expected ||
      !batch.entities.has(l.from) ||
      !batch.entities.has(l.expected),
  );
}
// A previous review applies only to the exact sample sources it covered.
export const sourceSignature = JSON.stringify(dossier);

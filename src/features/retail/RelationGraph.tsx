import { Building2, Package, CalendarDays, Store } from "lucide-react";
import { impact, type Citation, type Impact } from "./model";
import type { View, Interaction } from "./story";

type Node = {
  id: string;
  label: string;
  kind: "공급사" | "상품" | "행사" | "매장";
  x: number;
  y: number;
  citation: Citation;
};
type Edge = {
  id: string;
  from: Node;
  to: Node;
  label: string;
  citation: Citation;
};
const icons = {
  공급사: Building2,
  상품: Package,
  행사: CalendarDays,
  매장: Store,
};

export function buildGraph(result: Impact) {
  const supplier: Node = {
    id: result.supplier,
    label: result.supplier,
    kind: "공급사",
    x: 91,
    y: 46,
    citation: { source: "products" },
  };
  const product: Node = {
    id: result.id,
    label: result.name,
    kind: "상품",
    x: 91,
    y: 158,
    citation: { source: "products" },
  };
  const nodes: Node[] = [supplier, product];
  const edges: Edge[] = [
    {
      id: "supplier-edge",
      from: supplier,
      to: product,
      label: "납품",
      citation: product.citation,
    },
  ];
  result.events.forEach(({ cells: [id, label], row }, i) => {
    const event: Node = {
      id,
      label,
      kind: "행사",
      x: 320,
      y: 158 + 96 * i,
      citation: { source: "events", rows: [row] },
    };
    nodes.push(event);
    edges.push({
      id: "event-edge-" + id,
      from: product,
      to: event,
      label: "대상 상품",
      citation: event.citation,
    });
  });
  result.stores.forEach((label, i) => {
    const records = result.assignments.filter((r) => r.cells[1] === label);
    const store: Node = {
      id: "store-" + label,
      label,
      kind: "매장",
      x: 549,
      y: result.stores.length === 1 ? 158 : 110 + 96 * i,
      citation: { source: "stores", rows: records.map((r) => r.row) },
    };
    nodes.push(store);
    for (const eventId of new Set(records.map((r) => r.cells[0]))) {
      const event = nodes.find((n) => n.kind === "행사" && n.id === eventId)!;
      edges.push({
        id: eventId + "-" + store.id,
        from: event,
        to: store,
        label: "참여",
        citation: {
          source: "stores",
          rows: records.filter((r) => r.cells[0] === eventId).map((r) => r.row),
        },
      });
    }
  });
  return { nodes, edges };
}
const graph = buildGraph(impact);
export function RelationGraph({
  view,
  send,
  summary = false,
}: {
  view: View;
  send: (a: Interaction) => void;
  summary?: boolean;
}) {
  const active = Boolean(view.selected) || summary;
  const selected =
    graph.edges.find((edge) => edge.id === view.selected) ??
    graph.nodes.find((node) => node.id === view.selected);
  const height = Math.max(...graph.nodes.map((n) => n.y)) + 45;
  return (
    <section
      className={"rt-graph " + (active ? "rt-traced" : "")}
      aria-label="상품 관계 그래프"
    >
      <div className="rt-graph-head">
        <span className="rt-kicker">RELATION MAP</span>
        <span>
          {graph.nodes.length}개 노드 · {graph.edges.length}개 관계
        </span>
      </div>
      <svg
        viewBox={"0 0 640 " + height}
        aria-label="공급사에서 참여 매장까지의 관계"
      >
        {graph.edges.map((edge) => {
          const vertical = edge.from.x === edge.to.x;
          const x1 = edge.from.x + (vertical ? 0 : 70),
            y1 = edge.from.y + (vertical ? 32 : 0);
          const x2 = edge.to.x - (vertical ? 0 : 70),
            y2 = edge.to.y - (vertical ? 32 : 0);
          const mid = (x1 + x2) / 2,
            cy = (y1 + y2) / 2;
          const path = vertical
            ? `M ${x1} ${y1} V ${y2}`
            : `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
          const select = () =>
            send({
              type: "select",
              selected: edge.id,
              citation: edge.citation,
            });
          return (
            <g
              key={edge.id}
              className={
                view.selected === edge.id || view.selected === edge.to.id
                  ? "rt-picked"
                  : ""
              }
            >
              <path d={path} className="rt-line" fill="none" />
              <path
                d={path}
                fill="none"
                stroke="transparent"
                strokeWidth="18"
                onClick={select}
                style={{ cursor: "pointer" }}
              />
              <foreignObject x={mid - 33} y={cy - 16} width="66" height="32">
                <button
                  className="rt-edge"
                  aria-label={
                    edge.from.id +
                    " → " +
                    edge.to.label +
                    " " +
                    edge.label +
                    " 근거"
                  }
                  aria-pressed={view.selected === edge.id}
                  onClick={select}
                >
                  {edge.label}
                </button>
              </foreignObject>
            </g>
          );
        })}
        {graph.nodes.map((node) => {
          const Icon = icons[node.kind];
          return (
            <foreignObject
              key={node.id}
              x={node.x - 70}
              y={node.y - 32}
              width="140"
              height="64"
            >
              <button
                className={
                  "rt-node " + (node.kind === "상품" ? "rt-product" : "")
                }
                aria-pressed={view.selected === node.id}
                onClick={() =>
                  send({
                    type: "select",
                    selected: node.id,
                    citation: node.citation,
                  })
                }
              >
                <small>
                  <Icon size={13} />
                  {node.kind}
                  {["상품", "행사"].includes(node.kind) && " · " + node.id}
                </small>
                <strong>{node.label}</strong>
              </button>
            </foreignObject>
          );
        })}
      </svg>
      <div className="rt-graph-foot">
        {selected
          ? "from" in selected
            ? selected.from.label +
              " → " +
              selected.to.label +
              " · " +
              selected.label
            : selected.kind + " 선택 · " + selected.label
          : summary
            ? "확인된 영향 경로"
            : "상품 노드 또는 관계를 선택해 원문 근거를 확인하세요."}
      </div>
    </section>
  );
}

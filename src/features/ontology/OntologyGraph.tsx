import { useId } from "react";
import {
  Warehouse,
  Boxes,
  Package,
  FileText,
  Layers3,
  Truck,
  Check,
} from "lucide-react";
import { concepts, relations } from "../../mocks/seed";
import type { Concept } from "../../mocks/types";
import { relationLabels } from "./modelPresentation";
const icons = [Warehouse, Boxes, Package, FileText, Layers3, Truck];
const positions: Record<Concept, [number, number]> = {
  Warehouse: [4, 11],
  Inventory: [40, 11],
  Product: [76, 11],
  Order: [4, 65],
  OrderItem: [40, 65],
  Shipment: [76, 65],
};
// 900 × 400 model coordinates, matching the HTML nodes' 20% × 22% bounds.
const routes: Record<string, { path: string; label: [number, number] }> = {
  storedAt: { path: "M360 88H218", label: [32, 22] },
  stockOf: { path: "M540 88H682", label: [68, 22] },
  referencesProduct: { path: "M540 304H612V184H774V134", label: [86, 46] },
  containsItem: { path: "M216 304H358", label: [32, 76] },
  allocatedFrom: { path: "M126 260V134", label: [14, 49] },
  fulfilledBy: { path: "M126 348V382H774V350", label: [50, 95.5] },
};
export function OntologyGraph({
  selected,
  onSelect,
  selectedRelation,
  onRelationSelect,
  matches,
  connectedOnly = false,
}: {
  selected: Concept;
  onSelect: (concept: Concept) => void;
  selectedRelation?: string | null;
  onRelationSelect: (name: string) => void;
  matches?: ReadonlySet<Concept>;
  connectedOnly?: boolean;
}) {
  const markerId = useId();
  const related = new Set<Concept>([selected]);
  relations
    .filter((r) => r.from === selected || r.to === selected)
    .forEach((r) => {
      related.add(r.from);
      related.add(r.to);
    });
  const relevant = (id: Concept) =>
    (!matches || matches.has(id)) && (!connectedOnly || related.has(id));
  return (
    <div className="ontology-map" aria-label="업무 개념과 관계 그래프">
      <svg viewBox="0 0 900 400" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <marker
            id={markerId}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M0 0 10 5 0 10z" />
          </marker>
        </defs>
        {relations.map((r) => (
          <path
            key={r.name}
            d={routes[r.name].path}
            className={`${selectedRelation === r.name || (!selectedRelation && (r.from === selected || r.to === selected)) ? "relation-active" : ""} ${!relevant(r.from) && !relevant(r.to) ? "relation-muted" : ""}`}
            vectorEffect="non-scaling-stroke"
            markerEnd={`url(#${markerId})`}
          />
        ))}
      </svg>
      {relations.map((r) => (
        <button
          key={r.name}
          type="button"
          className={`ontology-edge-label ${selectedRelation === r.name ? "active" : ""}`}
          style={{
            left: `${routes[r.name].label[0]}%`,
            top: `${routes[r.name].label[1]}%`,
          }}
          aria-label={`${relationLabels[r.name]}: ${r.from} → ${r.to}`}
          aria-pressed={selectedRelation === r.name}
          onClick={() => onRelationSelect(r.name)}
        >
          <span>{relationLabels[r.name]}</span>
        </button>
      ))}
      {concepts.map((c, i) => {
        const Icon = icons[i];
        const [x, y] = positions[c.id];
        const active = selected === c.id && !selectedRelation;
        return (
          <button
            key={c.id}
            type="button"
            style={{ left: `${x}%`, top: `${y}%` }}
            className={`ontology-node ${active ? "active" : ""} ${!relevant(c.id) ? "node-muted" : ""}`}
            onClick={() => onSelect(c.id)}
            aria-pressed={active}
            aria-label={`${c.id} ${c.label} ${c.source}`}
          >
            <span className="ontology-node-title">
              <Icon size={17} />
              <strong>{c.label}</strong>
              {active && <Check size={14} />}
            </span>
            <span className="ontology-node-meta">
              <span>{c.id}</span>
              <small>{c.source}</small>
            </span>
          </button>
        );
      })}
    </div>
  );
}

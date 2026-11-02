import { OntologyWorkbench } from "./OntologyWorkbench";
export function Ontology({ onInteract }: { onInteract?: () => void }) {
  return <OntologyWorkbench onInteract={onInteract} />;
}

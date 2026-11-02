import { ArrowRight } from "lucide-react";
import { Brand, Button } from "../../components/ui";
import { OntologyWorkbench } from "../ontology/OntologyWorkbench";

/** The closing view uses the same read-only workbench as Ontology Explorer. */
export function FoundationEnding({
  explore,
  onInteract,
}: {
  explore: () => void;
  onInteract?: () => void;
}) {
  return (
    <section className="foundation-end" aria-labelledby="foundation-heading">
      <header className="foundation-heading">
        <h2 id="foundation-heading">
          모든 판단의 기반,
          <br />
          관리되는 기업 온톨로지.
        </h2>
        <Brand />
      </header>
      <OntologyWorkbench onInteract={onInteract} />
      <footer className="foundation-footer">
        <p>데이터를 연결하고, 결정을 앞당기다.</p>
        <Button variant="quiet" onClick={explore}>
          관계 모델 살펴보기
          <ArrowRight size={16} />
        </Button>
      </footer>
    </section>
  );
}

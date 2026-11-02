import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  GitBranch,
  Database,
  Network,
  ChevronRight,
  CircleHelp,
  Check,
  Building2,
  Menu,
  Sun,
  Moon,
} from "lucide-react";
import { useController } from "./controller";
import { useTheme } from "./theme";
import { BrandMark } from "../components/BrandMark";
import type { Command, Page } from "./state";
import { Brand, Button, Dialog, Assumptions } from "../components/ui";
import { Operations } from "../features/operations/Operations";
import { Overview } from "../features/overview/Overview";
import { Ontology } from "../features/ontology/Ontology";
import { DataSources } from "../features/sources/DataSources";
import { FoundationEnding } from "../features/ending/FoundationEnding";
import { DemoControls } from "../demo/DemoControls";
import { sceneIndex, scenes } from "../demo/timeline";
const pages = [
  {
    id: "overview",
    title: "Overview",
    icon: LayoutDashboard,
    subtitle: "운영의 변화에서, 대응의 시작점을 찾습니다.",
  },
  {
    id: "operations",
    title: "Operations Intelligence",
    icon: GitBranch,
    subtitle: "영향을 이해하고, 근거를 확인하고, 대응을 결정합니다.",
  },
  {
    id: "ontology",
    title: "Ontology Explorer",
    icon: Network,
    subtitle: "분석의 바탕이 되는 기업의 업무 관계입니다.",
  },
  {
    id: "sources",
    title: "Data Sources",
    icon: Database,
    subtitle: "분산된 시스템을 의미 있는 업무 개념으로 연결합니다.",
  },
] as const;
export default function App() {
  const { state, dispatch } = useController();
  const { theme, toggleTheme } = useTheme();
  const s = state.workspace;
  const [modal, setModal] = useState<"assumptions" | "ontology" | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [wide, setWide] = useState(
    window.innerWidth >= 1700 && window.innerHeight >= 1000,
  );
  const heading = useRef<HTMLHeadingElement>(null);
  const page = pages.find((p) => p.id === s.page);
  const send = (command: Command) => dispatch({ type: "command", command });
  const navigate = (destination: Page) => {
    send({ type: "navigate", page: destination });
    setMenuOpen(false);
    requestAnimationFrame(() => heading.current?.focus());
  };
  useEffect(() => {
    const resize = () =>
      setWide(window.innerWidth >= 1700 && window.innerHeight >= 1000);
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        modal ||
        e.isComposing ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey ||
        target.matches('input,textarea,select,[contenteditable="true"]')
      )
        return;
      if (e.key === "Escape") {
        dispatch({ type: "record", value: false });
        return;
      }
      if (e.code === "Space" && !target.closest("button")) {
        e.preventDefault();
        dispatch({ type: "toggle" });
      }
      if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        dispatch({ type: "start" });
      }
      const index = sceneIndex(state.time);
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        dispatch({
          type: "seek",
          time: scenes[
            Math.min(5, Math.max(0, index + (e.key === "ArrowRight" ? 1 : -1)))
          ].time,
        });
      }
      if (/^[1-6]$/.test(e.key)) {
        e.preventDefault();
        dispatch({ type: "seek", time: scenes[Number(e.key) - 1].time });
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [state.time, modal, dispatch]);
  const openModal = (value: "assumptions" | "ontology") => {
    dispatch({ type: "pause" });
    setModal(value);
  };
  return (
    <div
      className={`app ${state.record ? "record-mode" : ""} ${state.playing ? "is-playing" : "is-paused"}`}
      data-testid="app"
      data-page={s.page}
      data-playing={state.playing}
      data-scene={sceneIndex(state.time)}
    >
      <a className="skip-link" href="#main">
        본문으로 이동
      </a>
      <aside className={`sidebar ${menuOpen ? "menu-open" : ""}`}>
        <Brand />
        <div className="workspace-label">
          <span className="workspace-monogram">L</span>
          <div>
            <strong>LINK MARKET</strong>
            <span>Enterprise Workspace</span>
          </div>
        </div>
        <nav aria-label="주요 탐색">
          {pages.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                className={s.page === p.id ? "active" : ""}
                onClick={() => navigate(p.id)}
                aria-current={s.page === p.id ? "page" : undefined}
              >
                <Icon size={19} />
                <span>{p.title}</span>
                {s.page === p.id && <i />}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-foot">
          <div className="sidebar-mark">
            <Network size={22} />
          </div>
          <strong>기업의 맥락을 연결하다.</strong>
          <p>
            Connected enterprise
            <br />
            knowledge
          </p>
          <span>
            <i className="status-dot" />
            로컬 시연 워크스페이스
          </span>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="workspace-context">
            <Button
              className="mobile-menu"
              variant="quiet"
              aria-label="메뉴"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Menu size={20} />
            </Button>
            <span className="mobile-brand" role="img" aria-label="AsterGraph">
              <BrandMark />
            </span>
            <Building2 size={17} />
            <strong>LINK MARKET</strong>
            <ChevronRight size={14} />
            <span>Enterprise Workspace</span>
          </div>
          <div>
            <span className="demo-badge">DEMO · SIMULATED DATA</span>
            <Button
              className="theme-toggle"
              variant="quiet"
              aria-label={
                theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"
              }
              title={
                theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"
              }
              onClick={() => {
                dispatch({ type: "pause" });
                toggleTheme();
              }}
            >
              {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
            </Button>
            <span className="workspace-avatar" aria-hidden="true">
              LM
            </span>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          <div className="page-heading">
            <div>
              <h1 ref={heading} tabIndex={-1}>
                {page?.title ?? "AsterGraph"}
              </h1>
              <p>{page?.subtitle ?? "데이터를 연결하고, 결정을 앞당기다."}</p>
            </div>
            <button className="managed" onClick={() => openModal("ontology")}>
              <Check size={15} />
              <span>Ontology v1.2 · Managed</span>
              <CircleHelp size={15} />
            </button>
          </div>
          <div className="workspace-body">
            {s.page === "operations" && (
              <Operations
                state={s}
                send={send}
                pageSize={wide ? 7 : 6}
                showAssumptions={() => openModal("assumptions")}
                connection={
                  state.active && state.time >= 4000 && state.time < 7000
                }
              />
            )}
            {s.page === "overview" && (
              <Overview open={() => navigate("operations")} />
            )}
            {s.page === "ontology" && (
              <Ontology onInteract={() => dispatch({ type: "pause" })} />
            )}
            {s.page === "sources" && (
              <DataSources explore={() => navigate("ontology")} />
            )}
            {s.page === "end" && (
              <FoundationEnding
                key={state.generation}
                explore={() => navigate("ontology")}
                onInteract={() => dispatch({ type: "pause" })}
              />
            )}
          </div>
          <DemoControls state={state} dispatch={dispatch} />
        </main>
      </div>
      {modal && (
        <Dialog
          title={
            modal === "assumptions"
              ? "분석 가정과 시뮬레이션 범위"
              : "Ontology v1.2 · Managed"
          }
          close={() => setModal(null)}
        >
          {modal === "assumptions" ? (
            <Assumptions />
          ) : (
            <>
              <p>
                지속적으로 관리되는 기업 온톨로지의 제품 콘셉트를 표현한 목업
                시연 설정입니다.
              </p>
              <p>
                실제 온톨로지 구축 완료나 외부 시스템 연결을 뜻하지 않습니다.
                Ontology Explorer에서 이 데모의 개념과 관계를 확인할 수
                있습니다.
              </p>
            </>
          )}
        </Dialog>
      )}
    </div>
  );
}

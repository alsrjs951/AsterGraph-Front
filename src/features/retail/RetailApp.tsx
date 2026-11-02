import { useEffect, useState } from "react";
import {
  Bell,
  History as HistoryIcon,
  Files,
  GitCompareArrows,
  Network,
  Search,
  ListChecks,
  ChevronRight,
  Building2,
  Menu,
  Moon,
  Sun,
  CircleHelp,
} from "lucide-react";
import { Brand, Button, Dialog } from "../../components/ui";
import { BrandMark } from "../../components/BrandMark";
import { useTheme } from "../../app/theme";
import { DemoControls } from "../../demo/DemoControls";
import { captionAt, duration, scenes, type Interaction } from "./story";
import { useRetailDemo } from "./useRetailDemo";
import { Evidence, RetailScenes } from "./RetailScenes";
import "./retail.css";
import { recordCount } from "./Catalog";
import {
  ReviewDialog,
  ReviewStrip,
  ReviewTimeline,
  useKnowledgeReview,
} from "./KnowledgeReview";
import { sourceOrder, impact, dossier, handoffNote } from "./model";
const icons = [Bell, GitCompareArrows, Search, Network, Files, ListChecks];
export default function RetailApp() {
  const { state, dispatch } = useRetailDemo();
  const { theme, toggleTheme } = useTheme();
  const [help, setHelp] = useState(false);
  const [menu, setMenu] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const { scene, citation } = state.view;
  const sourceRow = citation.rows?.[0] ?? 2;
  const productId =
    scene === 4 &&
    (citation.source === "products" || citation.source === "changes")
      ? dossier[citation.source].rows[sourceRow - 2][0]
      : impact.id;
  const review = useKnowledgeReview(productId);
  const openHistory = () => {
    dispatch({ type: "pause" });
    setHistoryOpen(true);
  };
  const { view } = state;
  const send = (action: Interaction) => {
    dispatch({ type: "manual", action });
    setMenu(false);
  };
  const pause = () => dispatch({ type: "pause" });
  useEffect(() => {
    document.title = "AsterGraph · 마트 운영 워크스페이스";
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        help ||
        historyOpen ||
        e.isComposing ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey ||
        (e.target as HTMLElement).closest(
          "input,textarea,select,[contenteditable=true]",
        )
      )
        return;
      if (e.key === "Escape") {
        dispatch({ type: "record", value: false });
        setMenu(false);
        return;
      }
      if (
        e.code === "Space" &&
        !(e.target as HTMLElement).closest("a,button")
      ) {
        e.preventDefault();
        dispatch({ type: "toggle" });
      }
      if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        dispatch({ type: "start" });
      }
      let scene = view.scene;
      if (e.key === "ArrowRight") scene = Math.min(5, scene + 1);
      else if (e.key === "ArrowLeft") scene = Math.max(0, scene - 1);
      else if (/^[1-6]$/.test(e.key)) scene = Number(e.key) - 1;
      else return;
      e.preventDefault();
      dispatch({ type: "seek", time: scenes[scene].time });
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [view.scene, help, historyOpen, dispatch]);
  return (
    <div
      className={"app retail " + (state.record ? "record-mode" : "")}
      data-scene={view.scene}
      data-playing={state.playing}
    >
      <a className="skip-link" href="#main">
        본문으로 이동
      </a>
      <aside className={"sidebar " + (menu ? "menu-open" : "")}>
        <Brand />
        <div className="workspace-label">
          <span className="workspace-monogram">L</span>
          <div>
            <strong>LINK MARKET</strong>
            <span>Enterprise Workspace</span>
          </div>
        </div>
        <nav aria-label="주요 탐색">
          {[0, 4, 1, 3, 2, 5].map((i) => {
            const s = scenes[i];
            const Icon = icons[i];
            return (
              <div key={s.time}>
                {(i === 0 || i === 3) && (
                  <small className="km-nav-label">
                    {i === 0 ? "지식 운영" : "탐색 및 활용"}
                  </small>
                )}
                <button
                  key={s.time}
                  className={view.scene === i ? "active" : ""}
                  aria-current={view.scene === i ? "page" : undefined}
                  onClick={() => send({ type: "open", scene: i })}
                >
                  <Icon size={19} />
                  <span>{s.title}</span>
                  {view.scene === i && <i />}
                </button>
              </div>
            );
          })}
        </nav>
        <div className="sidebar-foot">
          <div className="sidebar-mark">
            <Network size={22} />
          </div>
          <small className="rt-kicker">WORKSPACE INDEX</small>
          <strong className="km-index">
            {recordCount.toLocaleString()} <small>레코드</small>
          </strong>
          <p>원본 {sourceOrder.length}개 · 구매 운영</p>
          <button className="text-button" onClick={openHistory}>
            관리 이력 열기 ↗
          </button>
          <a className="text-button" href="/?demo=logistics">
            기존 물류 시연 열기 ↗
          </a>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="workspace-context">
            <Button
              className="mobile-menu"
              variant="quiet"
              aria-label="메뉴"
              aria-expanded={menu}
              onClick={() => {
                pause();
                setMenu(!menu);
              }}
            >
              <Menu size={20} />
            </Button>
            <span className="mobile-brand" aria-label="AsterGraph">
              <BrandMark />
            </span>
            <Building2 size={17} />
            <strong>LINK MARKET</strong>
            <ChevronRight size={14} />
            <span>구매 운영</span>
          </div>
          <div>
            <button
              className="demo-badge"
              onClick={() => {
                pause();
                setHelp(true);
              }}
            >
              시연 데이터 <CircleHelp size={13} />
            </button>
            <Button
              className="theme-toggle"
              variant="quiet"
              aria-label={
                theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"
              }
              onClick={() => {
                pause();
                toggleTheme();
              }}
            >
              {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
            </Button>
            <span className="workspace-avatar">LM</span>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          <div className="page-heading">
            <div>
              <h1>{scenes[view.scene].title}</h1>
              <p>구매 운영 워크스페이스 / 공급사 납품 변경</p>
            </div>
            <span className="rt-counter">
              CASE 01 <b>/</b> STEP 0{view.scene + 1} OF 06
            </span>
          </div>
          <div className="rt-workspace">
            <RetailScenes
              key={state.epoch}
              view={view}
              send={send}
              reviewStrip={
                <ReviewStrip
                  handoff={view.scene === 5}
                  status={review.status}
                  open={openHistory}
                />
              }
            />
            {view.scene === 1 && view.ledger ? (
              <aside className="panel rt-evidence" aria-label="변경 관리 기록">
                <div className="rt-evidence-title">
                  <HistoryIcon size={19} />
                  <h2>변경 관리 기록</h2>
                </div>
                <div className="rt-evidence-body">
                  <span className="rt-kicker">VERSION HISTORY</span>
                  <h3>{review.subject.id} · 납품 상태</h3>
                  <p>구매운영팀 · {review.status}</p>
                  <ReviewTimeline review={review} />
                  <Button onClick={openHistory}>검토 기록 관리</Button>
                </div>
              </aside>
            ) : (
              <Evidence
                citation={view.citation}
                onInteract={pause}
                reviewAction={
                  view.scene === 4 &&
                  (citation.source === "products" ||
                    citation.source === "changes") ? (
                    <button className="km-manage" onClick={openHistory}>
                      {productId} 검토 이력 보기 →
                    </button>
                  ) : undefined
                }
              />
            )}
          </div>
          <DemoControls
            state={state}
            dispatch={dispatch}
            duration={duration}
            scenes={scenes}
            caption={captionAt(state.time)}
          />
        </main>
      </div>
      {historyOpen && (
        <ReviewDialog
          initialNote={view.scene === 5 ? handoffNote : ""}
          review={review}
          close={() => setHistoryOpen(false)}
        />
      )}
      {help && (
        <Dialog title="시연 데이터 안내" close={() => setHelp(false)}>
          <p>
            가상 공급사와 마트의 샘플 문서 5개를 사용합니다. 문서에서 추출한
            지식은 시연을 위해 미리 구성했습니다.
          </p>
          <p>
            변경 비교, 상품·행사·매장 연결 조회, 대상 집계와 원본 열기는
            브라우저에서 동작합니다. 질의응답은 지정 질문에 대해 로컬 자료를
            조회합니다.
          </p>
        </Dialog>
      )}
    </div>
  );
}

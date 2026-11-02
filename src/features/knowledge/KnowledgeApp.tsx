import { useEffect, useState } from "react";
import {
  Building2,
  CheckCheck,
  ChevronRight,
  CircleHelp,
  Database,
  GitCompareArrows,
  History,
  Menu,
  Moon,
  Network,
  Search,
  Sun,
} from "lucide-react";
import { useTheme } from "../../app/theme";
import { Brand, Button, Dialog } from "../../components/ui";
import { DemoControls } from "../../demo/DemoControls";
import { Catalog, recordCount } from "../retail/Catalog";
import { Evidence } from "../retail/RetailScenes";
import type { CatalogState } from "../retail/story";
import { dossier, impact } from "../retail/model";
import {
  captionAt,
  duration,
  scenes,
  type Page,
  type Command,
} from "./workflow";
import { useWorkspace } from "./useWorkspace";
import { WorkScenes } from "./WorkScenes";
import "../retail/retail.css";
import "./knowledge.css";
const nav = [
  { page: "catalog", label: "자료 카탈로그", icon: Database },
  { page: "build", label: "지식 구축", icon: Network },
  { page: "review", label: "관계 검수", icon: CheckCheck },
  { page: "impact", label: "변경 관리", icon: GitCompareArrows },
  { page: "answer", label: "지식 검색", icon: Search },
] as const;
export default function KnowledgeApp() {
  const { state, work, dispatch } = useWorkspace();
  const { theme, toggleTheme } = useTheme();
  const [dialog, setDialog] = useState<"history" | "help" | null>(null);
  const [menu, setMenu] = useState(false);
  const [catalog, setCatalog] = useState<CatalogState>({
    records: false,
    term: "",
    source: "all",
    page: 0,
  });
  const current = scenes.findLastIndex((s) => state.time >= s.time);
  const pause = () => dispatch({ type: "pause" });
  const send = (command: Command) => dispatch({ type: "work", command });
  const navigate = (page: Page) => {
    dispatch({ type: "workspace", command: { type: "page", page } });
    setMenu(false);
  };
  const popup = (value: "help" | "history") => {
    pause();
    setDialog(value);
  };
  useEffect(() => {
    document.title = "AsterGraph · 감귤 기획전 준비";
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        dialog ||
        document.querySelector("dialog[open]") ||
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
        setMenu(false);
        dispatch({ type: "record", value: false });
        return;
      }
      if (
        e.code === "Space" &&
        !(e.target as HTMLElement).closest("a,button")
      ) {
        e.preventDefault();
        dispatch({ type: "toggle" });
      }
      if (e.key.toLowerCase() === "r") dispatch({ type: "start" });
      let scene = current;
      if (/^[1-4]$/.test(e.key)) scene = Number(e.key) - 1;
      else if (e.key === "ArrowRight") scene = Math.min(3, current + 1);
      else if (e.key === "ArrowLeft") scene = Math.max(0, current - 1);
      else return;
      e.preventDefault();
      dispatch({ type: "seek", time: scenes[scene].time });
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [dialog, current, dispatch]);
  const revision = work.revisions.at(-1);
  return (
    <div
      className={"app retail kg " + (state.record ? "record-mode" : "")}
      data-scene={current}
      data-page={work.page}
      data-version={revision?.version ?? 0}
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
        <nav aria-label="업무 메뉴">
          {nav.map(({ page, label, icon: Icon }, i) => (
            <div key={page}>
              {(i === 0 || i === 3) && (
                <small className="km-nav-label">
                  {i === 0 ? "자료 및 지식" : "운영 및 활용"}
                </small>
              )}
              <button
                className={work.page === page ? "active" : ""}
                aria-current={work.page === page ? "page" : undefined}
                onClick={() => navigate(page)}
              >
                <Icon size={19} />
                <span>{label}</span>
              </button>
            </div>
          ))}
        </nav>
        <div className="sidebar-foot">
          <Database size={21} />
          <strong className="km-index">
            {recordCount.toLocaleString()} <small>레코드</small>
          </strong>
          <p>구매 운영 자료 · 원본 5개</p>
          <button className="text-button" onClick={() => popup("history")}>
            <History size={14} /> 승인 이력 보기
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="workspace-context">
            <Button
              className="mobile-menu"
              variant="quiet"
              aria-label="업무 메뉴 열기"
              aria-expanded={menu}
              onClick={() => {
                pause();
                setMenu(!menu);
              }}
            >
              <Menu size={18} />
            </Button>
            <Building2 size={17} />
            <strong>LINK MARKET</strong>
            <ChevronRight size={14} />
            <span>구매 운영</span>
          </div>
          <div>
            <button className="demo-badge" onClick={() => popup("help")}>
              시연 데이터 <CircleHelp size={13} />
            </button>
            <Button
              className="theme-toggle"
              variant="quiet"
              aria-label="테마 전환"
              onClick={() => {
                pause();
                toggleTheme();
              }}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
            <span className="workspace-avatar">LM</span>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          <div className="page-heading">
            <div>
              <h1>{nav.find((item) => item.page === work.page)?.label}</h1>
              <p>구매 운영 워크스페이스 / 신선식품 행사 준비</p>
            </div>
            {state.active ? (
              <div className="kg-mode">
                <span>시연 {String(current + 1).padStart(2, "0")} / 04</span>
                {!state.record && (
                  <button onClick={() => dispatch({ type: "workspace" })}>
                    수동 작업으로
                  </button>
                )}
              </div>
            ) : (
              <small className="rt-counter">행사 운영 · 2026년 11월</small>
            )}
          </div>
          <div className="rt-workspace">
            {work.page === "catalog" ? (
              <Catalog
                state={catalog}
                update={(patch) =>
                  setCatalog((prev) => ({ ...prev, ...patch }))
                }
                citation={work.citation}
                select={(citation) => send({ type: "cite", citation })}
                next={() => navigate("build")}
                nextLabel="행사 준비로 이동"
              />
            ) : (
              <WorkScenes work={work} send={send} />
            )}
            <Evidence citation={work.citation} onInteract={pause} />
          </div>
          <DemoControls
            state={state}
            dispatch={dispatch}
            scenes={scenes}
            duration={duration}
            caption={captionAt(state.time)}
          />
        </main>
      </div>
      {dialog === "help" && (
        <Dialog title="시연 데이터 안내" close={() => setDialog(null)}>
          <p>
            샘플 원본 5개 중 준비 자료 3개를 일괄 처리합니다. AI 추출 후보는
            시연용이며, 개체 집계와 관계별 원본 ID 대조는 로컬에서 실행합니다.
            담당자의 묶음 승인이 있어야 해당 버전을 변경 관리와 검색에 사용할 수
            있습니다.
          </p>
          <p>
            질의응답은 지정 질문을 승인된 로컬 자료에서 조회합니다. 자동 재생은
            수동 작업과 별개이며 수동 승인 이력은 이 브라우저에 저장됩니다.
          </p>
          <a href="/?demo=retail-case">이전 마트 시연</a> ·{" "}
          <a href="/?demo=logistics">기존 물류 시연</a>
        </Dialog>
      )}
      {dialog === "history" && (
        <Dialog title="상품 지식 승인 이력" close={() => setDialog(null)}>
          <p>
            {impact.name} · {impact.id}
            {state.active ? " · 시연 중인 작업" : " · 수동 작업"}
          </p>
          <ol className="kg-history">
            <li>
              <b>추출 초안</b>
              <p>{impact.id} → E-08 · 담당자 검수 대상</p>
            </li>
            {work.revisions.map((r) => (
              <li key={r.version}>
                <b>
                  {r.version === 1 ? "승인본" : "변경본"} v{r.version} ·{" "}
                  {r.status}
                </b>
                <p>
                  {r.reviewer} ·{" "}
                  {r.version === 1
                    ? "관계 " + r.reviewedLinks + "개 묶음 승인"
                    : "납품 상태 1건 변경 승인"}
                  <br />
                  {r.product} → {r.event} · {r.reason}
                </p>
                <button
                  onClick={() => {
                    send({ type: "cite", citation: r.evidence });
                    setDialog(null);
                  }}
                >
                  {dossier[r.evidence.source].file} {r.evidence.rows?.join("·")}
                  행 보기 ↗
                </button>
              </li>
            ))}
          </ol>
        </Dialog>
      )}
    </div>
  );
}

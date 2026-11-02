import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Video,
} from "lucide-react";
import type { Dispatch } from "react";
import type { AppAction, AppState } from "../app/controller";
import { scenes as logisticsScenes, DURATION } from "./timeline";
import { Button } from "../components/ui";
export function DemoControls({
  state,
  dispatch,
  scenes = logisticsScenes,
  duration = DURATION,
  caption,
}: {
  state: Pick<AppState, "playing" | "time" | "active" | "record">;
  dispatch: Dispatch<
    Extract<
      AppAction,
      { type: "start" | "toggle" | "reset" | "seek" | "record" }
    >
  >;
  scenes?: readonly { time: number; label: string; caption: string }[];
  duration?: number;
  caption?: string;
}) {
  const current = Math.max(
    0,
    scenes.findLastIndex((scene) => state.time >= scene.time),
  );
  if (state.record)
    return (
      <footer className="demo-caption" aria-label="시연 자막">
        {state.active
          ? (caption ?? scenes[current].caption)
          : "Space로 시연 시작 · R 처음부터 · Esc 녹화 모드 해제"}
      </footer>
    );
  return (
    <footer className="demo-dock">
      <div className="dock-hint">
        <span>
          제품 시연 <span className="subtle">/ {duration / 1000}초</span>
        </span>
        <span>
          Space 재생·정지 <span>R 처음부터</span> <span>← → 장면 이동</span>
        </span>
      </div>
      <div className="dock-controls">
        <Button
          variant="primary"
          className="play-button"
          onClick={() =>
            dispatch({
              type: state.active && state.time < duration ? "toggle" : "start",
            })
          }
        >
          {state.playing ? <Pause size={18} /> : <Play size={18} />}
          <span>
            {state.playing
              ? "일시정지"
              : state.active && state.time < duration
                ? "재개"
                : `${duration / 1000}초 데모 시작`}
          </span>
        </Button>
        <Button
          variant="quiet"
          onClick={() => dispatch({ type: "reset" })}
          aria-label="리셋"
        >
          <RotateCcw size={18} />
        </Button>
        <div className="scene-buttons" aria-label="장면 선택">
          {scenes.map((s, i) => (
            <button
              key={s.time}
              className={state.active && i === current ? "active" : ""}
              aria-current={state.active && i === current ? "step" : undefined}
              onClick={() => dispatch({ type: "seek", time: s.time })}
              aria-label={`장면 ${i + 1}: ${s.label}`}
            >
              <span>{i + 1}</span>
              {s.label}
            </button>
          ))}
        </div>
        <div className="scene-step">
          <Button
            variant="quiet"
            aria-label="이전 장면"
            disabled={current === 0}
            onClick={() =>
              dispatch({ type: "seek", time: scenes[current - 1].time })
            }
          >
            <SkipBack size={17} />
          </Button>
          <Button
            variant="quiet"
            aria-label="다음 장면"
            disabled={current === scenes.length - 1}
            onClick={() =>
              dispatch({ type: "seek", time: scenes[current + 1].time })
            }
          >
            <SkipForward size={17} />
          </Button>
        </div>
        <output className="timecode" data-testid="timecode">
          {(state.time / 1000).toFixed(1)}
          <span> / {duration / 1000}</span>
        </output>
        <Button
          onClick={() => dispatch({ type: "record", value: true })}
          aria-label="녹화 모드"
        >
          <Video size={18} />
          <span>녹화 모드</span>
        </Button>
      </div>
      <div className="timeline-track" aria-hidden="true">
        <i style={{ transform: `scaleX(${state.time / duration})` }} />
      </div>
      {state.active && !state.playing && state.time < duration && (
        <span className="resume-note">
          재개하면 현재 시각의 데모 상태로 돌아갑니다.
        </span>
      )}
    </footer>
  );
}

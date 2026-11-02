import { useEffect, useReducer } from "react";
import {
  initialWorkspace,
  workspaceReducer,
  type Command,
  type WorkspaceState,
} from "./state";
import { DURATION, stateAt } from "../demo/timeline";
export interface AppState {
  workspace: WorkspaceState;
  time: number;
  playing: boolean;
  active: boolean;
  record: boolean;
  generation: number;
  manualAnalysis: boolean;
  reducedMotion: boolean;
}
export const initialApp = (): AppState => ({
  workspace: initialWorkspace(),
  time: 0,
  playing: false,
  active: false,
  record: false,
  generation: 0,
  manualAnalysis: false,
  reducedMotion: false,
});
export type AppAction =
  | { type: "command"; command: Command }
  | { type: "analysis-finished"; generation: number }
  | { type: "tick"; time: number }
  | { type: "seek"; time: number }
  | { type: "start" }
  | { type: "toggle" }
  | { type: "pause" }
  | { type: "reset" }
  | { type: "record"; value: boolean }
  | { type: "motion"; reduced: boolean };
export function appReducer(s: AppState, a: AppAction): AppState {
  switch (a.type) {
    case "command": {
      const workspace = workspaceReducer(s.workspace, a.command);
      return {
        ...s,
        workspace,
        playing: false,
        generation:
          s.generation +
          (a.command.type === "query" || a.command.type === "analyze" ? 1 : 0),
        manualAnalysis:
          a.command.type === "analyze"
            ? workspace.status === "analyzing"
            : s.manualAnalysis && workspace.status === "analyzing",
      };
    }
    case "analysis-finished":
      return a.generation === s.generation && s.manualAnalysis
        ? {
            ...s,
            workspace: workspaceReducer(s.workspace, { type: "complete" }),
            manualAnalysis: false,
          }
        : s;
    case "tick":
      return s.playing
        ? {
            ...s,
            time: Math.min(DURATION, a.time),
            workspace: stateAt(a.time, s.reducedMotion),
            playing: a.time < DURATION,
          }
        : s;
    case "seek": {
      const time = Math.max(0, Math.min(DURATION, a.time));
      return {
        ...s,
        active: true,
        time,
        workspace: stateAt(time, s.reducedMotion),
        manualAnalysis: false,
        generation: s.generation + 1,
        playing: s.playing && time < DURATION,
      };
    }
    case "start":
      return {
        ...s,
        time: 0,
        playing: true,
        active: true,
        workspace: stateAt(0, s.reducedMotion),
        manualAnalysis: false,
        generation: s.generation + 1,
      };
    case "toggle":
      return s.playing
        ? { ...s, playing: false }
        : appReducer(
            { ...s, playing: true },
            { type: "seek", time: s.time >= DURATION ? 0 : s.time },
          );
    case "pause":
      return { ...s, playing: false };
    case "reset":
      return {
        ...initialApp(),
        generation: s.generation + 1,
        reducedMotion: s.reducedMotion,
      };
    case "record":
      return { ...s, record: a.value };
    case "motion":
      return { ...s, reducedMotion: a.reduced };
  }
}
export function useController() {
  const [state, dispatch] = useReducer(appReducer, undefined, initialApp);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => dispatch({ type: "motion", reduced: media.matches });
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!state.manualAnalysis) return;
    const timer = window.setTimeout(
      () =>
        dispatch({ type: "analysis-finished", generation: state.generation }),
      600,
    );
    return () => clearTimeout(timer);
  }, [state.manualAnalysis, state.generation]);
  useEffect(() => {
    if (!state.playing) return;
    const offset = state.time;
    const start = performance.now();
    let frame: number;
    const advance = () => {
      const time = offset + performance.now() - start;
      dispatch({ type: "tick", time });
      if (time < DURATION) frame = requestAnimationFrame(advance);
    };
    frame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(frame);
    // A seek changes generation, while regular frames retain it and use one monotonic clock.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.playing, state.generation]);
  useEffect(() => {
    const hide = () => {
      if (document.hidden) dispatch({ type: "pause" });
    };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, []);
  return { state, dispatch };
}

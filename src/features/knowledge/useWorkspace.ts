import { useEffect, useReducer } from "react";
import {
  apply,
  duration,
  initialWork,
  workAt,
  type Command,
  type Work,
} from "./workflow";

import { sourceSignature } from "./batch";
const storageKey = "astergraph.knowledge.batch-approvals.1";
// Restore only a validated approval sequence. Replay never writes this key.
function restore() {
  let w = initialWork();
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
    if (
      saved?.signature === sourceSignature &&
      (saved.version === 1 || saved.version === 2)
    ) {
      const commands: Command[] = [
        { type: "build" },
        { type: "inspect" },
        { type: "edit", value: saved.event },
        { type: "approve" },
      ];
      if (saved.version === 2)
        commands.push(
          { type: "page", page: "impact" },
          { type: "compare" },
          { type: "update" },
        );
      w = commands.reduce(apply, w);
      if (w.revisions.at(-1)?.version !== saved.version) return initialWork();
    }
  } catch {
    return initialWork();
  }
  return w;
}
function initial() {
  return {
    manual: restore(),
    replay: null as Work | null,
    time: 0,
    playing: false,
    active: false,
    record: false,
    reduced: false,
    epoch: 0,
  };
}
type State = ReturnType<typeof initial>;
type Action =
  | { type: "start" | "toggle" | "reset" | "pause" }
  | { type: "record" | "motion"; value: boolean }
  | { type: "seek" | "tick"; time: number }
  | { type: "work"; command: Command }
  | { type: "workspace"; command?: Command };
function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "work":
      return s.replay
        ? { ...s, playing: false, replay: apply(s.replay, a.command) }
        : { ...s, manual: apply(s.manual, a.command) };
    case "workspace":
      return {
        ...s,
        replay: null,
        playing: false,
        active: false,
        time: 0,
        manual: a.command ? apply(s.manual, a.command) : s.manual,
      };
    case "reset":
      return {
        ...s,
        replay: null,
        playing: false,
        active: false,
        time: 0,
        record: false,
      };
    case "motion":
      return { ...s, reduced: a.value };
    case "record":
      return { ...s, record: a.value };
    case "pause":
      return { ...s, playing: false };
    case "start":
      return reducer({ ...s, playing: true }, { type: "seek", time: 0 });
    case "toggle":
      return s.playing
        ? { ...s, playing: false }
        : reducer(
            { ...s, playing: true },
            { type: "seek", time: s.time === duration ? 0 : s.time },
          );
    case "tick":
    case "seek": {
      if (a.type === "tick" && !s.playing) return s;
      const time = Math.max(0, Math.min(duration, a.time));
      return {
        ...s,
        time,
        active: true,
        replay: workAt(time, s.reduced),
        playing: s.playing && time < duration,
        epoch: s.epoch + Number(a.type === "seek"),
      };
    }
  }
}
export function useWorkspace() {
  const [state, dispatch] = useReducer(reducer, undefined, initial);
  const revision = state.manual.revisions.at(-1);
  useEffect(() => {
    if (revision) {
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            signature: sourceSignature,
            version: revision.version,
            event: revision.event,
          }),
        );
      } catch {
        /* Session still works without storage. */
      }
    }
  }, [revision]);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const motion = () => dispatch({ type: "motion", value: media.matches });
    const hide = () => {
      if (document.hidden) dispatch({ type: "pause" });
    };
    motion();
    media.addEventListener("change", motion);
    document.addEventListener("visibilitychange", hide);
    return () => {
      media.removeEventListener("change", motion);
      document.removeEventListener("visibilitychange", hide);
    };
  }, []);
  useEffect(() => {
    if (!state.playing) return;
    const origin = performance.now() - state.time;
    const timer = setInterval(
      () => dispatch({ type: "tick", time: performance.now() - origin }),
      50,
    );
    return () => clearInterval(timer);
  }, [state.playing, state.epoch]);
  return { state, dispatch, work: state.replay ?? state.manual };
}

import { useEffect, useReducer } from "react";
import { duration, interact, scenes, viewAt, type Interaction } from "./story";
const initial = () => ({
  time: 0,
  playing: false,
  record: false,
  active: false,
  epoch: 0,
  reduced: false,
  view: viewAt(0),
});
type State = ReturnType<typeof initial>;
type Action =
  | { type: "toggle" | "start" | "pause" | "reset" }
  | { type: "record" | "motion"; value: boolean }
  | { type: "seek" | "tick"; time: number }
  | { type: "manual"; action: Interaction };
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "manual": {
      const view = interact(state.view, action.action);
      return {
        ...state,
        view,
        playing: false,
        time:
          action.action.type === "open" || action.action.type === "verify"
            ? scenes[view.scene].time
            : state.time,
      };
    }
    case "pause":
      return { ...state, playing: false };
    case "record":
      return { ...state, record: action.value };
    case "motion":
      return { ...state, reduced: action.value };
    case "reset":
      return { ...initial(), reduced: state.reduced, epoch: state.epoch + 1 };
    case "toggle":
      return state.playing
        ? { ...state, playing: false }
        : reducer(
            { ...state, playing: true },
            { type: "seek", time: state.time >= duration ? 0 : state.time },
          );
    case "start":
      return reducer({ ...state, playing: true }, { type: "seek", time: 0 });
    case "tick":
    case "seek": {
      if (action.type === "tick" && !state.playing) return state;
      const time = Math.max(0, Math.min(duration, action.time));
      return {
        ...state,
        time,
        active: true,
        playing: state.playing && time < duration,
        view: viewAt(time, state.reduced),
        epoch: state.epoch + Number(action.type === "seek"),
      };
    }
  }
}
export function useRetailDemo() {
  const [state, dispatch] = useReducer(reducer, undefined, initial);
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
    const offset = performance.now() - state.time;
    const timer = setInterval(
      () => dispatch({ type: "tick", time: performance.now() - offset }),
      50,
    );
    return () => clearInterval(timer);
    // Seeking creates a new clock origin. Ticks leave the origin unchanged.
  }, [state.playing, state.epoch]);
  return { state, dispatch };
}

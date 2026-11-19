import { useSyncExternalStore } from "react";

/**
 * App-wide "busy" flag for the full-screen loader. Anything can call `beginBusy()`;
 * it returns a function that ends it. The overlay stays up a minimum time so quick
 * clicks still show feedback instead of flickering.
 */
let count = 0;
let visible = false;
let shownAt = 0;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

let guard: number | undefined;
const show = () => {
  if (!visible) { visible = true; shownAt = Date.now(); emit(); }
  // Safety net: a request that never returns must not leave the screen covered.
  window.clearTimeout(guard);
  guard = window.setTimeout(() => { count = 0; if (visible) { visible = false; emit(); } }, 12000);
};
const hideSoon = () => {
  const wait = Math.max(0, 350 - (Date.now() - shownAt));
  window.setTimeout(() => { if (count === 0 && visible) { visible = false; emit(); } }, wait);
};

export const beginBusy = () => {
  count++;
  show();
  let done = false;
  return () => { if (done) return; done = true; count = Math.max(0, count - 1); if (count === 0) hideSoon(); };
};

/** A short pulse for clicks that do not hit the network (navigation, tabs). */
export const pulseBusy = (ms = 450) => { const end = beginBusy(); window.setTimeout(end, ms); };

export const useBusy = () => useSyncExternalStore((cb) => (subs.add(cb), () => subs.delete(cb)), () => visible, () => false);

let lastClick = 0;
export const markClick = () => { lastClick = Date.now(); };
/** Network calls count towards the loader only when a person just acted (a click, or any write), never for background polling. */
export const isUserDriven = (method?: string) => (method || "get").toLowerCase() !== "get" || Date.now() - lastClick < 1500;

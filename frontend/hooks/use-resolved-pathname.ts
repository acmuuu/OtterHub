"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

/**
 * 与浏览器地址栏一致的路径名。静态导出 (output: 'export') 下 Client Nav 后
 * `usePathname` / `useParams` 偶发不同步，因此用 window + History 作事实来源。
 * @see https://github.com/vercel/next.js/issues/54393
 */
const listeners = new Set<() => void>();
let historyPatched = false;

function emit() {
  listeners.forEach((l) => l());
}

function ensureHistoryPatched() {
  if (historyPatched || typeof window === "undefined") return;
  historyPatched = true;
  const h = window.history;
  const push = h.pushState.bind(h);
  const replace = h.replaceState.bind(h);
  h.pushState = (data, unused, url) => {
    const r = push(data, unused, url);
    queueMicrotask(emit);
    return r;
  };
  h.replaceState = (data, unused, url) => {
    const r = replace(data, unused, url);
    queueMicrotask(emit);
    return r;
  };
  window.addEventListener("popstate", emit);
}

function subscribe(fn: () => void) {
  ensureHistoryPatched();
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function getPathSnapshot() {
  return window.location.pathname;
}

export function useResolvedPathname() {
  const nextPath = usePathname() ?? "/";

  return useSyncExternalStore(
    subscribe,
    getPathSnapshot,
    () => nextPath,
  );
}

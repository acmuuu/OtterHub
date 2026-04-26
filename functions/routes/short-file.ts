import { Hono } from "hono";
import { getKeyByShortId, hasFileIndex } from "@utils/file-index";
import type { Env } from "../types/hono";

const RESERVED = new Set([
  "health",
  "auth",
  "settings",
  "wallpaper",
  "upload",
  "trash",
  "proxy",
  "share",
  "file",
  "login",
  "favicon.ico",
  "_next",
  "assets",
]);

/**
 * 根路径短链：GET /{shortId} → 302 到 /file/{shortId}（由现有 raw 路由解析）
 */
export const shortFileRoutes = new Hono<{ Bindings: Env }>();

shortFileRoutes.get("/:shortId", async (c) => {
  const shortId = c.req.param("shortId");
  if (RESERVED.has(shortId)) {
    return c.notFound();
  }
  if (!/^[A-Za-z0-9_-]{6,64}$/.test(shortId)) {
    return c.notFound();
  }
  if (!hasFileIndex(c.env)) {
    return c.notFound();
  }
  const key = await getKeyByShortId(c.env, shortId);
  if (!key) {
    return c.notFound();
  }
  const url = new URL(c.req.url);
  return c.redirect(`${url.origin}/file/${shortId}`, 302);
});

import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import type { Env } from "../../types/hono";
import { authMiddleware } from "../../middleware/auth";
import { fail, ok } from "@utils/response";
import { backfillFileIndexFromKV } from "@utils/file-index";

export const indexMaintenanceRoutes = new Hono<{ Bindings: Env }>();

indexMaintenanceRoutes.post(
  "/index/backfill",
  authMiddleware,
  zValidator(
    "query",
    z.object({
      limit: z.string().optional().transform((val) => val ? parseInt(val, 10) : 500),
      cursor: z.string().optional(),
    }),
  ),
  async (c) => {
    const { limit, cursor } = c.req.valid("query");

    if (limit < 1) {
      return fail(c, "Invalid limit parameter", 400);
    }

    try {
      const result = await backfillFileIndexFromKV(c.env, { limit, cursor });
      return ok(c, result);
    } catch (error: any) {
      console.error("[D1:backfill] error:", error);
      return fail(c, `Failed to backfill D1 index: ${error.message}`, 500);
    }
  },
);


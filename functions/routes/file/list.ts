import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { FileType } from '@shared/types';
import type { Env } from '../../types/hono';
import { fail } from '@utils/response';
import { authMiddleware } from 'middleware/auth';
import { listIndexedFiles } from '@utils/file-index';

export const listRoutes = new Hono<{ Bindings: Env }>();

listRoutes.get(
  '/list',
  authMiddleware,
  zValidator(
    'query',
    z.object({
      limit: z.string().optional().transform((val) => val ? parseInt(val, 10) : 50),
      cursor: z.string().optional(),
      fileType: z.enum(FileType).optional(),
      search: z.string().optional(),
      liked: z.string().optional().transform((val) => val === "true"),
      tags: z.string().optional().transform((val) => val ? val.split(",").filter(Boolean) : undefined),
      dateStart: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
      dateEnd: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
      sortType: z.enum(["uploadedAt", "name", "fileSize"]).optional(),
      sortOrder: z.enum(["asc", "desc"]).optional(),
    })
  ),
  async (c) => {
    const {
      limit,
      cursor,
      fileType,
      search,
      liked,
      tags,
      dateStart,
      dateEnd,
      sortType,
      sortOrder,
    } = c.req.valid('query');
    const kv = c.env.oh_file_url; 

    if (limit < 1) {
      return fail(c, 'Invalid limit parameter', 400);
    }

    const options = {
      prefix: fileType ? `${fileType}:` : undefined,
      limit: Math.min(limit, 1000),
      cursor,
    };

    try {
      if (c.env.oh_file_db) {
        try {
          const indexed = await listIndexedFiles(c.env, {
            limit,
            cursor,
            fileType,
            search,
            liked,
            tags,
            dateStart,
            dateEnd,
            sortType,
            sortOrder,
          });
          if (indexed) {
            return c.json({
              success: true,
              data: indexed,
            });
          }
        } catch (err) {
          console.warn("[D1:list] fallback to KV list:", err);
        }
      }

      const result = await kv.list(options);
      return c.json({
        success: true,
        data: {
          keys: result.keys,
          list_complete: result.list_complete,
          cursor: result.cursor,
        }
      });
    } catch (err) {
      console.error("[KV:list] error:", err);
      return fail(c, 'Failed to fetch files');
    }
  }
);

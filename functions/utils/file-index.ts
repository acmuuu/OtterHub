import { FileItem, FileMetadata, FileType, trashPrefix } from "@shared/types";
import type { D1Database, Env, KVNamespace } from "../types/hono";

type FileIndexRow = {
  key: string;
  file_type: FileType;
  file_name: string;
  file_size: number;
  uploaded_at: number;
  liked: number;
  tags_json: string | null;
  desc: string | null;
  thumb_url: string | null;
  chunk_info_json: string | null;
  deleted_at: number | null;
  short_id: string | null;
};

type ListIndexedFilesOptions = {
  fileType?: FileType;
  limit: number;
  cursor?: string;
  search?: string;
  liked?: boolean;
  tags?: string[];
  dateStart?: number;
  dateEnd?: number;
  sortType?: "uploadedAt" | "name" | "fileSize";
  sortOrder?: "asc" | "desc";
};

type DecodedCursor = {
  sortValue: string | number;
  key: string;
};

type BackfillOptions = {
  limit: number;
  cursor?: string;
};

const FILE_TYPES = new Set<string>(Object.values(FileType));
let schemaReady = false;

const SHORT_ID_LEN = 12;
const SHORT_ID_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";

function randomShortId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(SHORT_ID_LEN));
  let out = "";
  for (let i = 0; i < SHORT_ID_LEN; i++) {
    out += SHORT_ID_ALPHABET[bytes[i]! % SHORT_ID_ALPHABET.length];
  }
  return out;
}

async function shortIdExists(db: D1Database, id: string): Promise<boolean> {
  const row = await db.prepare("SELECT 1 AS ok FROM files WHERE short_id = ? LIMIT 1")
    .bind(id)
    .first<{ ok: number }>();
  return Boolean(row?.ok);
}

async function generateUniqueShortId(db: D1Database): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const id = randomShortId();
    if (!(await shortIdExists(db, id))) return id;
  }
  throw new Error("Failed to allocate unique short_id");
}

export async function getShortIdForKey(env: Env, key: string): Promise<string | null> {
  const db = getD1(env);
  if (!db) return null;
  try {
    await ensureFileIndexSchema(env);
    const row = await db.prepare("SELECT short_id FROM files WHERE key = ?")
      .bind(key)
      .first<{ short_id: string | null }>();
    return row?.short_id ?? null;
  } catch {
    return null;
  }
}

export async function getKeyByShortId(env: Env, shortId: string): Promise<string | null> {
  const db = getD1(env);
  if (!db) return null;
  if (shortId.length < 6 || shortId.length > 64) return null;
  try {
    await ensureFileIndexSchema(env);
    const row = await db.prepare("SELECT key FROM files WHERE short_id = ? AND deleted_at IS NULL")
      .bind(shortId)
      .first<{ key: string }>();
    return row?.key ?? null;
  } catch {
    return null;
  }
}

/**
 * 将 URL 中的标识解析为 KV key：已是完整 key（含 `:`）则原样返回，否则按 short_id 查 D1。
 */
export async function resolvePublicFileKey(env: Env, param: string): Promise<string> {
  if (param.includes(":")) {
    return param;
  }
  if (param.length < 6) {
    return param;
  }
  const key = await getKeyByShortId(env, param);
  return key ?? param;
}

async function migrateFileIndexColumns(db: D1Database) {
  const info = await db.prepare("PRAGMA table_info(files)").all<{ name: string }>();
  const names = new Set((info.results ?? []).map((col: { name: string }) => col.name));
  if (!names.has("short_id")) {
    await db.prepare("ALTER TABLE files ADD COLUMN short_id TEXT").run();
  }
  await db.prepare(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_files_short_id
    ON files(short_id) WHERE short_id IS NOT NULL
  `).run();
}

function getD1(env: Env) {
  return env.oh_file_db;
}

export function hasFileIndex(env: Env) {
  return Boolean(getD1(env));
}

function extractIndexedFileType(key: string): FileType | null {
  const rawKey = key.startsWith(trashPrefix) ? key.slice(trashPrefix.length) : key;
  const [prefix] = rawKey.split(":");
  return FILE_TYPES.has(prefix) && prefix !== FileType.Trash
    ? (prefix as FileType)
    : null;
}

function isTrashKey(key: string) {
  return key.startsWith(trashPrefix);
}

function toFileIndexRow(
  key: string,
  metadata: FileMetadata,
  deletedAt?: number | null,
): FileIndexRow | null {
  const fileType = extractIndexedFileType(key);
  if (!fileType) return null;

  return {
    key,
    file_type: fileType,
    file_name: metadata.fileName,
    file_size: metadata.fileSize ?? 0,
    uploaded_at: metadata.uploadedAt ?? 0,
    liked: metadata.liked ? 1 : 0,
    tags_json: metadata.tags ? JSON.stringify(metadata.tags) : null,
    desc: metadata.desc ?? null,
    thumb_url: metadata.thumbUrl ?? null,
    chunk_info_json: metadata.chunkInfo ? JSON.stringify(metadata.chunkInfo) : null,
    deleted_at: deletedAt ?? (isTrashKey(key) ? Date.now() : null),
    short_id: null,
  };
}

function rowToMetadata(row: FileIndexRow): FileMetadata {
  return {
    fileName: row.file_name,
    fileSize: row.file_size,
    uploadedAt: row.uploaded_at,
    liked: Boolean(row.liked),
    tags: row.tags_json ? JSON.parse(row.tags_json) : undefined,
    desc: row.desc ?? undefined,
    thumbUrl: row.thumb_url ?? undefined,
    chunkInfo: row.chunk_info_json ? JSON.parse(row.chunk_info_json) : undefined,
  };
}

function rowToFileItem(row: FileIndexRow): FileItem {
  const metadata = rowToMetadata(row);

  return {
    name: row.key,
    shortId: row.short_id ?? undefined,
    metadata,
  };
}

function getSortConfig(
  sortType: ListIndexedFilesOptions["sortType"] = "uploadedAt",
  sortOrder: ListIndexedFilesOptions["sortOrder"] = "desc",
) {
  const order = sortOrder === "asc" ? "ASC" : "DESC";

  switch (sortType) {
    case "name":
      return {
        column: "file_name",
        expression: "file_name COLLATE NOCASE",
        order,
        value: (row: FileIndexRow) => row.file_name,
      };
    case "fileSize":
      return {
        column: "file_size",
        expression: "file_size",
        order,
        value: (row: FileIndexRow) => row.file_size,
      };
    case "uploadedAt":
    default:
      return {
        column: "uploaded_at",
        expression: "uploaded_at",
        order,
        value: (row: FileIndexRow) => row.uploaded_at,
      };
  }
}

function encodeCursor(
  row: FileIndexRow,
  sortConfig: ReturnType<typeof getSortConfig>,
) {
  return btoa(JSON.stringify({ sortValue: sortConfig.value(row), key: row.key }));
}

function decodeCursor(cursor?: string): DecodedCursor | null {
  if (!cursor) return null;
  try {
    const decoded = JSON.parse(atob(cursor)) as DecodedCursor;
    if (
      (typeof decoded.sortValue !== "number" && typeof decoded.sortValue !== "string") ||
      typeof decoded.key !== "string"
    ) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export async function ensureFileIndexSchema(env: Env) {
  const db = getD1(env);
  if (!db) return false;
  if (schemaReady) return true;

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS files (
      key TEXT PRIMARY KEY,
      file_type TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_size INTEGER NOT NULL DEFAULT 0,
      uploaded_at INTEGER NOT NULL DEFAULT 0,
      liked INTEGER NOT NULL DEFAULT 0,
      tags_json TEXT,
      desc TEXT,
      thumb_url TEXT,
      chunk_info_json TEXT,
      deleted_at INTEGER,
      short_id TEXT CHECK (
        short_id IS NULL
        OR (LENGTH(short_id) >= 6 AND LENGTH(short_id) <= 64)
      )
    )
  `).run();

  await migrateFileIndexColumns(db);

  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_files_active_type_uploaded
    ON files(file_type, uploaded_at DESC, key DESC)
    WHERE deleted_at IS NULL
  `).run();

  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_files_trash_uploaded
    ON files(deleted_at DESC, uploaded_at DESC, key DESC)
    WHERE deleted_at IS NOT NULL
  `).run();

  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_files_active_type_size
    ON files(file_type, file_size DESC, key DESC)
    WHERE deleted_at IS NULL
  `).run();

  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_files_active_type_name
    ON files(file_type, file_name COLLATE NOCASE ASC, key ASC)
    WHERE deleted_at IS NULL
  `).run();

  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_files_active_type_liked
    ON files(file_type, liked, uploaded_at DESC, key DESC)
    WHERE deleted_at IS NULL
  `).run();

  schemaReady = true;
  return true;
}

export async function upsertFileIndex(
  env: Env,
  key: string,
  metadata: FileMetadata,
  options: { deletedAt?: number | null; shortId?: string | null } = {},
) {
  const db = getD1(env);
  if (!db) return;

  const row = toFileIndexRow(key, metadata, options.deletedAt);
  if (!row) return;

  try {
    await ensureFileIndexSchema(env);
    const existingShort = await db.prepare("SELECT short_id FROM files WHERE key = ?")
      .bind(key)
      .first<{ short_id: string | null }>();

    let shortId: string;
    if (options.shortId !== undefined && options.shortId !== null) {
      shortId = options.shortId;
    } else if (existingShort?.short_id) {
      shortId = existingShort.short_id;
    } else {
      shortId = await generateUniqueShortId(db);
    }

    await db.prepare(`
      INSERT INTO files (
        key,
        file_type,
        file_name,
        file_size,
        uploaded_at,
        liked,
        tags_json,
        desc,
        thumb_url,
        chunk_info_json,
        deleted_at,
        short_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        file_type = excluded.file_type,
        file_name = excluded.file_name,
        file_size = excluded.file_size,
        uploaded_at = excluded.uploaded_at,
        liked = excluded.liked,
        tags_json = excluded.tags_json,
        desc = excluded.desc,
        thumb_url = excluded.thumb_url,
        chunk_info_json = excluded.chunk_info_json,
        deleted_at = excluded.deleted_at,
        short_id = COALESCE(files.short_id, excluded.short_id)
    `)
      .bind(
        row.key,
        row.file_type,
        row.file_name,
        row.file_size,
        row.uploaded_at,
        row.liked,
        row.tags_json,
        row.desc,
        row.thumb_url,
        row.chunk_info_json,
        row.deleted_at,
        shortId,
      )
      .run();
  } catch (error) {
    console.warn(`[D1:index] upsert failed for ${key}:`, error);
  }
}

export async function deleteFileIndex(env: Env, key: string) {
  const db = getD1(env);
  if (!db) return;

  try {
    await ensureFileIndexSchema(env);
    await db.prepare("DELETE FROM files WHERE key = ?").bind(key).run();
  } catch (error) {
    console.warn(`[D1:index] delete failed for ${key}:`, error);
  }
}

export async function getIndexedFileMetadataWithValue(env: Env, key: string) {
  const db = getD1(env);
  if (!db) return null;

  try {
    await ensureFileIndexSchema(env);
    const row = await db.prepare("SELECT * FROM files WHERE key = ?")
      .bind(key)
      .first<FileIndexRow>();

    if (!row) return null;

    const value = await env.oh_file_url.get(key);

    return {
      metadata: rowToMetadata(row),
      value: value ?? null,
    };
  } catch (error) {
    console.warn(`[D1:index] read failed for ${key}:`, error);
    return null;
  }
}

export async function moveFileIndexToTrash(
  env: Env,
  key: string,
  trashKey: string,
  metadata: FileMetadata,
) {
  const shortId = await getShortIdForKey(env, key);
  await deleteFileIndex(env, key);
  await upsertFileIndex(env, trashKey, metadata, {
    deletedAt: Date.now(),
    shortId: shortId ?? undefined,
  });
}

export async function restoreFileIndexFromTrash(
  env: Env,
  trashKey: string,
  originalKey: string,
  metadata: FileMetadata,
) {
  const shortId = await getShortIdForKey(env, trashKey);
  await deleteFileIndex(env, trashKey);
  await upsertFileIndex(env, originalKey, metadata, {
    deletedAt: null,
    shortId: shortId ?? undefined,
  });
}

export async function listIndexedFiles(
  env: Env,
  options: ListIndexedFilesOptions,
) {
  const db = getD1(env);
  if (!db) return null;

  await ensureFileIndexSchema(env);

  const limit = Math.min(Math.max(options.limit, 1), 1000);
  const cursor = decodeCursor(options.cursor);
  const sortConfig = getSortConfig(options.sortType, options.sortOrder);
  const binds: Array<string | number> = [];
  const where: string[] = [];

  if (options.fileType === FileType.Trash) {
    where.push("deleted_at IS NOT NULL");
  } else {
    where.push("deleted_at IS NULL");
    if (options.fileType) {
      where.push("file_type = ?");
      binds.push(options.fileType);
    }
  }

  if (options.search) {
    const search = `%${options.search.toLowerCase()}%`;
    where.push(`(
      lower(file_name) LIKE ?
      OR lower(key) LIKE ?
      OR lower(COALESCE(short_id, '')) LIKE ?
      OR lower(COALESCE(desc, '')) LIKE ?
      OR lower(COALESCE(tags_json, '')) LIKE ?
    )`);
    binds.push(search, search, search, search, search);
  }

  if (options.liked) {
    where.push("liked = 1");
  }

  if (options.tags?.length) {
    for (const tag of options.tags) {
      where.push("COALESCE(tags_json, '[]') LIKE ?");
      binds.push(`%"${tag}"%`);
    }
  }

  if (options.dateStart !== undefined) {
    where.push("uploaded_at >= ?");
    binds.push(options.dateStart);
  }

  if (options.dateEnd !== undefined) {
    where.push("uploaded_at <= ?");
    binds.push(options.dateEnd);
  }

  if (cursor) {
    const operator = sortConfig.order === "ASC" ? ">" : "<";
    where.push(`(
      ${sortConfig.expression} ${operator} ?
      OR (${sortConfig.expression} = ? AND key ${operator} ?)
    )`);
    binds.push(cursor.sortValue, cursor.sortValue, cursor.key);
  }

  const rows = await db.prepare(`
    SELECT *
    FROM files
    WHERE ${where.join(" AND ")}
    ORDER BY ${sortConfig.expression} ${sortConfig.order}, key ${sortConfig.order}
    LIMIT ?
  `)
    .bind(...binds, limit + 1)
    .all<FileIndexRow>();

  const results = rows.results ?? [];
  const page = results.slice(0, limit);
  const hasMore = results.length > limit;
  const last = page[page.length - 1];

  return {
    keys: page.map(rowToFileItem),
    list_complete: !hasMore,
    cursor: hasMore && last ? encodeCursor(last, sortConfig) : undefined,
  };
}

export async function backfillFileIndexFromKV(
  env: Env,
  options: BackfillOptions,
) {
  const db = getD1(env);
  if (!db) {
    throw new Error("D1 binding oh_file_db is not configured");
  }

  await ensureFileIndexSchema(env);

  const kv = env.oh_file_url as KVNamespace;
  const limit = Math.min(Math.max(options.limit, 1), 1000);
  const list = await kv.list({ limit, cursor: options.cursor });

  let indexed = 0;
  let skipped = 0;

  for (const item of list.keys ?? []) {
    const key = item.name as string;
    const metadata = item.metadata as FileMetadata | undefined;
    if (!metadata || !extractIndexedFileType(key)) {
      skipped += 1;
      continue;
    }

    await upsertFileIndex(env, key, metadata);
    indexed += 1;
  }

  return {
    scanned: list.keys?.length ?? 0,
    indexed,
    skipped,
    list_complete: Boolean(list.list_complete),
    cursor: list.cursor as string | undefined,
  };
}

/** 为历史行补全 short_id（每行一次 upsert） */
export async function assignMissingShortIds(env: Env, limit: number) {
  const db = getD1(env);
  if (!db) {
    throw new Error("D1 binding oh_file_db is not configured");
  }

  await ensureFileIndexSchema(env);
  const cap = Math.min(Math.max(limit, 1), 1000);
  const rows = await db.prepare(
    "SELECT * FROM files WHERE short_id IS NULL LIMIT ?",
  )
    .bind(cap)
    .all<FileIndexRow>();

  let updated = 0;
  for (const row of rows.results ?? []) {
    await upsertFileIndex(env, row.key, rowToMetadata(row), {
      deletedAt: row.deleted_at,
    });
    updated += 1;
  }

  return { updated, limit: cap };
}


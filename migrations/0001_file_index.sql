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
  deleted_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_files_active_type_uploaded
ON files(file_type, uploaded_at DESC, key DESC)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_files_trash_uploaded
ON files(deleted_at DESC, uploaded_at DESC, key DESC)
WHERE deleted_at IS NOT NULL;


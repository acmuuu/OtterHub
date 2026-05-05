import { FileType } from "@shared/types";

export type StoredUploadFileType = Exclude<FileType, FileType.Trash>;

export type UploadFileHint = {
  /** 显式分类：决定存储 key 前缀 img:/audio:/video:/doc: 与 Telegram 选用的 API */
  fileType?: StoredUploadFileType;
};

const UPLOAD_FILE_TYPE_SET = new Set<string>([
  FileType.Image,
  FileType.Audio,
  FileType.Video,
  FileType.Document,
]);

/**
 * 解析 multipart / 查询中的 fileType 字段；缺省返回 undefined；非法值抛出带说明的 Error。
 */
export function parseUploadFileTypeField(raw: FormDataEntryValue | null): StoredUploadFileType | undefined {
  if (raw == null || raw === "") return undefined;
  const s = typeof raw === "string" ? raw.trim() : String(raw).trim();
  if (s === "") return undefined;
  if (!UPLOAD_FILE_TYPE_SET.has(s)) {
    throw new Error(`Invalid fileType "${s}". Allowed: ${[...UPLOAD_FILE_TYPE_SET].join(", ")}`);
  }
  return s as StoredUploadFileType;
}

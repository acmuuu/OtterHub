import { FileType } from "@shared/types";

/**
 * 对外 URL 段（与 KV 中 FileType 枚举值可不同：如 image 对应 img、document 对应 doc）
 */
export const FILE_TYPE_PATH_SEGMENTS = [
  "image",
  "audio",
  "video",
  "document",
] as const;

export type FileTypePathSegment = (typeof FILE_TYPE_PATH_SEGMENTS)[number];

const SEGMENT_SET = new Set<string>(FILE_TYPE_PATH_SEGMENTS);

const PATH_SEGMENT_TO_FILE_TYPE: Record<FileTypePathSegment, FileType> = {
  image: FileType.Image,
  audio: FileType.Audio,
  video: FileType.Video,
  document: FileType.Document,
};

const FILE_TYPE_TO_PATH_SEGMENT: Record<
  FileType.Image | FileType.Audio | FileType.Video | FileType.Document,
  FileTypePathSegment
> = {
  [FileType.Image]: "image",
  [FileType.Audio]: "audio",
  [FileType.Video]: "video",
  [FileType.Document]: "document",
};

export function isValidTypeSegment(
  s: string | undefined,
): s is FileTypePathSegment {
  return s !== undefined && SEGMENT_SET.has(s);
}

export function pathSegmentToFileType(
  s: FileTypePathSegment,
): FileType {
  return PATH_SEGMENT_TO_FILE_TYPE[s];
}

/** 主库四类型 → URL 段；回收站等非列表类型无路径 */
export function fileTypeToPathSegment(t: FileType): string | null {
  if (t in FILE_TYPE_TO_PATH_SEGMENT) {
    return FILE_TYPE_TO_PATH_SEGMENT[t as keyof typeof FILE_TYPE_TO_PATH_SEGMENT];
  }
  return null;
}

export function typeSegmentToFileType(
  s: string,
): FileType | null {
  if (!isValidTypeSegment(s)) return null;
  return pathSegmentToFileType(s);
}

export const DEFAULT_FILE_TYPE_PATH: FileTypePathSegment = "image";

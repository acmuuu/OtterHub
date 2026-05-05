import type { Env } from "../types/hono";
import type { SuccessfulSingleUploadPayload, FileMetadata } from "@shared/types";
import { getShortIdForKey } from "./file-index";

/** 单次 / 流式整包上传成功后的结构化响应（含可直接访问的长/短链） */
export async function buildSuccessfulSingleUploadPayload(
  env: Env,
  reqUrl: string,
  key: string,
  metadata: FileMetadata,
): Promise<SuccessfulSingleUploadPayload> {
  const origin = new URL(reqUrl).origin;
  const shortId = await getShortIdForKey(env, key);
  return {
    key,
    fileName: metadata.fileName,
    fileSize: metadata.fileSize,
    uploadedAt: metadata.uploadedAt,
    urlLong: `${origin}/file/${encodeURIComponent(key)}`,
    urlShort: shortId ? `${origin}/file/${shortId}` : null,
    shortLink: shortId ? `${origin}/${shortId}` : null,
    shortId,
  };
}

import type { LucideIcon } from "lucide-react";
import { FileText, ImageIcon, Music, Video } from "lucide-react";
import { FileType } from "@shared/types";

/** 主库文件类型 Tab / 下拉的展示文案与图标 */
export const FILE_TYPE_FILTER_OPTIONS: {
  id: FileType;
  label: string;
  icon: LucideIcon;
}[] = [
  { id: FileType.Image, label: "图片", icon: ImageIcon },
  { id: FileType.Audio, label: "音频", icon: Music },
  { id: FileType.Video, label: "视频", icon: Video },
  { id: FileType.Document, label: "文档", icon: FileText },
];

import { Music } from "lucide-react";
import { FileItem } from "@shared/types";
import { FileCardGridBase } from "./FileCardGridBase";
import { ICON_DISPLAY_SIZE } from "./FileContent";
import { useFileCardActions } from "./hooks";

interface FileAudioGridCardProps {
  file: FileItem;
  actions: ReturnType<typeof useFileCardActions>;
}

export function FileAudioGridCard({ file, actions }: FileAudioGridCardProps) {
  return (
    <FileCardGridBase
      file={file}
      actions={actions}
      preview={<Music className={`text-emerald-300 ${ICON_DISPLAY_SIZE}`} />}
      onCardClick={actions.handleView}
    />
  );
}

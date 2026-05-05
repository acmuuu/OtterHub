import { Music } from "lucide-react";
import { FileItem } from "@shared/types";
import { FileCardListBase } from "./FileCardListBase";
import { useFileCardActions } from "./hooks";

interface FileAudioListCardProps {
  file: FileItem;
  actions: ReturnType<typeof useFileCardActions>;
}

export function FileAudioListCard({ file, actions }: FileAudioListCardProps) {
  return (
    <FileCardListBase
      file={file}
      actions={actions}
      showPlayAction
      icon={<Music className="h-4 w-4 text-emerald-400" />}
    />
  );
}

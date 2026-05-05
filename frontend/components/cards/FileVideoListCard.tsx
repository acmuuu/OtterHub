import { Video } from "lucide-react";
import { FileItem } from "@shared/types";
import { FileCardListBase } from "./FileCardListBase";
import { useFileCardActions } from "./hooks";

interface FileVideoListCardProps {
  file: FileItem;
  actions: ReturnType<typeof useFileCardActions>;
}

export function FileVideoListCard({ file, actions }: FileVideoListCardProps) {
  return (
    <FileCardListBase
      file={file}
      actions={actions}
      showPlayAction
      icon={<Video className="h-4 w-4 text-purple-400" />}
    />
  );
}

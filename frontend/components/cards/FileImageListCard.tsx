import { ImageIcon } from "lucide-react";
import { FileItem } from "@shared/types";
import { FileCardListBase } from "./FileCardListBase";
import { useFileCardActions } from "./hooks";

interface FileImageListCardProps {
  file: FileItem;
  actions: ReturnType<typeof useFileCardActions>;
}

export function FileImageListCard({ file, actions }: FileImageListCardProps) {
  return (
    <FileCardListBase
      file={file}
      actions={actions}
      icon={<ImageIcon className="h-4 w-4 text-blue-400" />}
    />
  );
}

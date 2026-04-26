import { FileText } from "lucide-react";
import { FileItem } from "@shared/types";
import { FileCardListBase } from "./FileCardListBase";
import { useFileCardActions } from "./hooks";

interface FileDocumentListCardProps {
  file: FileItem;
  actions: ReturnType<typeof useFileCardActions>;
}

export function FileDocumentListCard({
  file,
  actions,
}: FileDocumentListCardProps) {
  return (
    <FileCardListBase
      file={file}
      actions={actions}
      icon={<FileText className="h-4 w-4 text-amber-400" />}
    />
  );
}

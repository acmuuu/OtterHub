import { FileText } from "lucide-react";
import { FileItem } from "@shared/types";
import { FileCardGridBase } from "./FileCardGridBase";
import { ICON_DISPLAY_SIZE } from "./FileContent";
import { useFileCardActions } from "./hooks";

interface FileDocumentGridCardProps {
  file: FileItem;
  actions: ReturnType<typeof useFileCardActions>;
}

export function FileDocumentGridCard({
  file,
  actions,
}: FileDocumentGridCardProps) {
  return (
    <FileCardGridBase
      file={file}
      actions={actions}
      preview={<FileText className={`text-amber-300 ${ICON_DISPLAY_SIZE}`} />}
    />
  );
}

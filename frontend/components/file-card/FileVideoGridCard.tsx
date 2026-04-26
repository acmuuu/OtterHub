import { Video } from "lucide-react";
import { FileItem } from "@shared/types";
import { cn } from "@/lib/utils";
import { FileCardGridBase } from "./FileCardGridBase";
import { ICON_DISPLAY_SIZE } from "./FileContent";
import { useFileCardActions } from "./hooks";

interface FileVideoGridCardProps {
  file: FileItem;
  actions: ReturnType<typeof useFileCardActions>;
}

export function FileVideoGridCard({ file, actions }: FileVideoGridCardProps) {
  const thumbUrl = file.metadata?.thumbUrl || "";
  const preview = thumbUrl ? (
    <img
      src={thumbUrl}
      alt={file.name}
      loading="lazy"
      decoding="async"
      className={cn(
        "w-full h-full object-cover transition-all duration-300",
        actions.blur ? "blur-xl scale-110" : "blur-0 scale-100",
      )}
    />
  ) : (
    <Video className={`text-purple-300 ${ICON_DISPLAY_SIZE}`} />
  );

  return (
    <FileCardGridBase
      file={file}
      actions={actions}
      preview={preview}
    />
  );
}

import { FileItem, FileType } from "@shared/types";
import { useFileCardActions } from "./hooks";
import { FileAudioGridCard } from "./FileAudioGridCard";
import { FileDocumentGridCard } from "./FileDocumentGridCard";
import { FileImageGridCard } from "./FileImageGridCard";
import { FileVideoGridCard } from "./FileVideoGridCard";

interface FileCardGridProps {
  file: FileItem;
  actions: ReturnType<typeof useFileCardActions>;
}

export function FileCardGrid({ file, actions }: FileCardGridProps) {
  switch (actions.fileType) {
    case FileType.Image:
      return <FileImageGridCard file={file} actions={actions} />;
    case FileType.Video:
      return <FileVideoGridCard file={file} actions={actions} />;
    case FileType.Audio:
      return <FileAudioGridCard file={file} actions={actions} />;
    case FileType.Document:
    default:
      return <FileDocumentGridCard file={file} actions={actions} />;
  }
}

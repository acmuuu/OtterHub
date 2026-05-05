import { FileItem, FileType } from "@shared/types";
import { useFileCardActions } from "./hooks";
import { FileAudioListCard } from "./FileAudioListCard";
import { FileDocumentListCard } from "./FileDocumentListCard";
import { FileImageListCard } from "./FileImageListCard";
import { FileVideoListCard } from "./FileVideoListCard";

interface FileCardListProps {
  file: FileItem;
  actions: ReturnType<typeof useFileCardActions>;
}

export function FileCardList({ file, actions }: FileCardListProps) {
  switch (actions.fileType) {
    case FileType.Image:
      return <FileImageListCard file={file} actions={actions} />;
    case FileType.Video:
      return <FileVideoListCard file={file} actions={actions} />;
    case FileType.Audio:
      return <FileAudioListCard file={file} actions={actions} />;
    case FileType.Document:
    default:
      return <FileDocumentListCard file={file} actions={actions} />;
  }
}

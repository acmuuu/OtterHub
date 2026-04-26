import { FileItem, FileType } from "@shared/types";
import { getFileUrl } from "@/lib/api";
import { shouldLoadImage } from "@/lib/utils";
import { useGeneralSettingsStore } from "@/stores/general-store";
import { FileImagePreview } from "./FileImagePreview";
import { FileCardGridBase } from "./FileCardGridBase";
import { useFileCardActions } from "./hooks";

interface FileImageGridCardProps {
  file: FileItem;
  actions: ReturnType<typeof useFileCardActions>;
}

export function FileImageGridCard({ file, actions }: FileImageGridCardProps) {
  const { imageLoadMode, dataSaverThreshold } = useGeneralSettingsStore();
  const shouldLoad = shouldLoadImage({
    fileType: FileType.Image,
    imageLoadMode,
    fileSize: file.metadata?.fileSize ?? 0,
    threshold: dataSaverThreshold * 1024 * 1024,
  });

  return (
    <FileCardGridBase
      file={file}
      actions={actions}
      preview={
        <FileImagePreview
          src={getFileUrl(file.name)}
          alt={file.name}
          fileKey={file.name}
          shouldLoad={shouldLoad}
          shouldBlur={actions.blur}
          canPreview={!actions.blur}
        />
      }
    />
  );
}

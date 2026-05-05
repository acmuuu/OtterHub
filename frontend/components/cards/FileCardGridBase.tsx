import { ReactNode } from "react";
import { Check, Loader2, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileTagBadge } from "@/components/tags/FileTagBadge";
import { FileDetailDialog } from "@/components/cards/FileDetailDialog";
import { FileActions } from "./FileActions";
import { FileItem } from "@shared/types";
import { cn, formatFileSize, formatDate } from "@/lib/utils";
import { useFileCardActions } from "./hooks";
import { NsfwSign } from "./NsfwSign";
import { FileEditDialog } from "./FileEditDialog";
import { ShareDialog } from "../share/share-dialog";

interface FileCardGridBaseProps {
  file: FileItem;
  actions: ReturnType<typeof useFileCardActions>;
  preview: ReactNode;
  /** 为 true 时不展示底部文件名（仅图片网格等场景） */
  hideFileName?: boolean;
  onCardClick?: () => void;
  cardClassName?: string;
  previewWrapperClassName?: string;
  previewInnerClassName?: string;
}

export function FileCardGridBase({
  file,
  actions,
  preview,
  hideFileName = false,
  onCardClick,
  cardClassName,
  previewWrapperClassName,
  previewInnerClassName,
}: FileCardGridBaseProps) {
  const {
    isSelected,
    blur,
    isIncompleteUpload,
    showDetail,
    showEdit,
    isResuming,
    setShowDetail,
    setShowEdit,
    handleSelect,
    handleDelete,
    handleCopyLink,
    handleDownload,
    handleView,
    handleEdit,
    handleEditSuccess,
    handleToggleLike,
    handleResumeUpload,
  } = actions;

  const tags = file.metadata?.tags ?? [];

  return (
    <>
      <div
        className={cn(
          "group relative aspect-square rounded-xl overflow-hidden backdrop-blur-xl border transition-all cursor-pointer",
          isSelected
            ? "bg-primary/20 border-primary/50 ring-2 ring-primary/50"
            : "bg-glass-bg border-glass-border hover:border-primary/50",
          cardClassName,
        )}
        onClick={onCardClick}
      >
        {/* Checkbox */}
        <div className="absolute top-3 left-3 z-10">
          <div
            className={cn(
              "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all backdrop-blur-sm",
              isSelected
                ? "bg-primary border-primary"
                : "bg-secondary/50 border-glass-border opacity-100 md:opacity-0 md:group-hover:opacity-100",
            )}
            onClick={handleSelect}
          >
            {isSelected && <Check className="h-4 w-4 text-white" />}
          </div>
        </div>

        {/* Actions Menu */}
        <div className="absolute top-3 right-3 z-10">
          <FileActions
            onDownload={handleDownload}
            onDelete={handleDelete}
            onView={handleView}
            onEdit={handleEdit}
            onToggleLike={handleToggleLike}
            onCopyLink={handleCopyLink}
            onShowDetail={() => setShowDetail(true)}
            onShare={actions.handleShare}
            isLiked={file.metadata?.liked || false}
          />
        </div>

        {/* File Content */}
        <div className={cn("absolute inset-0 flex items-center justify-center", previewWrapperClassName)}>
          <div
            className={cn(
              "relative w-full h-full bg-linear-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center",
              previewInnerClassName,
            )}
          >
            {preview}
            {blur && <NsfwSign />}
          </div>
        </div>

        {/* File Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-linear-to-t from-black/80 via-black/60 to-transparent">
          {hideFileName ? (
            tags.length > 0 && (
              <div className="flex items-center gap-2 mb-1">
                <div className="flex gap-1 shrink-0 flex-wrap">
                  {tags.map((tag) => (
                    <FileTagBadge key={tag} tag={tag} />
                  ))}
                </div>
              </div>
            )
          ) : (
            <div className="flex items-center gap-2 mb-1">
              <p
                className={cn(
                  "text-sm font-medium text-white truncate transition-all duration-300",
                  blur && "blur-xs select-none opacity-80",
                )}
                title={file.metadata?.fileName}
              >
                {file.metadata?.fileName || file.name}
              </p>
              <div className="flex gap-1 shrink-0">
                {tags.map((tag) => (
                  <FileTagBadge key={tag} tag={tag} />
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-xs text-white/50 min-w-0">
              <span className="shrink-0">{formatFileSize(file.metadata?.fileSize || 0)}</span>
              <span>•</span>
              <span className="shrink-0 truncate">{formatDate(file.metadata?.uploadedAt || 0)}</span>
            </p>
            {isIncompleteUpload && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleResumeUpload();
                }}
                disabled={isResuming}
                className="text-amber-300 hover:bg-amber-500/10 h-6 px-2 text-xs"
              >
                {isResuming ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <RotateCw className="h-3 w-3 mr-1" />
                    {file.metadata.chunkInfo!.uploadedIndices.length}/
                    {file.metadata.chunkInfo!.total}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
      <FileDetailDialog
        file={file}
        open={showDetail}
        onOpenChange={setShowDetail}
      />
      <FileEditDialog
        file={file}
        open={showEdit}
        onOpenChange={setShowEdit}
        onSuccess={handleEditSuccess}
      />
      <ShareDialog
        open={actions.showShare}
        onOpenChange={actions.setShowShare}
        fileKey={file.name}
        fileName={file.metadata?.fileName}
      />
    </>
  );
}

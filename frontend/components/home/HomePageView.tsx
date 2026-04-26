"use client";

import { useEffect, useLayoutEffect } from "react";
import { useResolvedPathname } from "@/hooks/use-resolved-pathname";
import { FileUploadZone } from "./FileUploadZone";
import { FileGallery } from "./FileGallery";
import { BatchOperationsBar } from "@/components/batch-operations/BatchOperationsBar";
import { EmptyState } from "./EmptyState";
import {
  useActiveItems,
  useFileDataStore,
  useHasAnySelection,
  useActiveViewMode,
} from "@/stores/file";
import { ViewMode } from "@/lib/types";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { FloatingActionButton } from "./FloatingActionButton";
import { useFileUpload } from "@/hooks/useFileUpload";
import { cn } from "@/lib/utils";
import { isValidTypeSegment, pathSegmentToFileType } from "@/lib/file-type-routes";

export function HomePageView() {
  const pathname = useResolvedPathname();
  const setActiveType = useFileDataStore((s) => s.setActiveType);

  const segment = pathname.split("/").filter(Boolean)[0];

  // URL 为单一数据源，与 zustand 中 activeType 对齐
  useLayoutEffect(() => {
    if (!isValidTypeSegment(segment)) return;
    const fileType = pathSegmentToFileType(segment);
    if (useFileDataStore.getState().activeType !== fileType) {
      void setActiveType(fileType);
    }
  }, [segment, setActiveType]);

  const {
    fileInputRef,
    inputAccept,
    uploadProgress,
    isFileDrag,
    openFileDialog,
    onInputChange,
    onMainDragOver,
    onMainDragLeave,
    onMainDrop,
  } = useFileUpload();
  const activeItems = useActiveItems();
  const hasAnySelection = useHasAnySelection();

  const { fetchNextPage } = useFileDataStore();
  const viewMode = useActiveViewMode();

  const isListOrGrid = [ViewMode.Grid, ViewMode.List].includes(viewMode);

  const showBatchBar = hasAnySelection && isListOrGrid;

  const isEmpty = activeItems.length === 0;

  useEffect(() => {
    fetchNextPage().catch((error) => {
      console.error("[HomePageView] fetch files failed:", error);
    });
  }, [fetchNextPage]);

  return (
    <div className="relative min-h-screen bg-linear-to-br from-gradient-from via-gradient-via to-gradient-to">
      <div className="relative z-10 flex min-h-screen flex-col">
        <Header />

        <main
          className={cn(
            "flex-1 p-6 md:p-8 transition-[box-shadow] rounded-none",
            isFileDrag &&
              "ring-2 ring-dashed ring-primary/60 ring-inset bg-primary/5",
          )}
          onDragOver={onMainDragOver}
          onDragLeave={onMainDragLeave}
          onDrop={onMainDrop}
        >
          <FileUploadZone uploadProgress={uploadProgress} />

          {isEmpty ? <EmptyState /> : <FileGallery />}
        </main>

        {showBatchBar && <BatchOperationsBar />}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={inputAccept}
          className="hidden"
          onChange={onInputChange}
        />

        <FloatingActionButton onUploadClick={openFileDialog} />

        <Footer />
      </div>
    </div>
  );
}

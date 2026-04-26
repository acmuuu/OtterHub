"use client";

import { useCallback, useMemo, useEffect, useRef } from "react";
import { useActiveBucket, useActiveItems, useFileDataStore, useFileQueryStore } from "@/stores/file";
import { useActiveViewMode, useFileUIStore } from "@/stores/file";
import { FileCard } from "@/components/file-card";
import { ViewModeToggle } from "./ViewModeToggle";
import { SortTypeDropdown } from "./SortTypeDropdown";
import { FilterDropdown } from "./FilterDropdown";
import { Pagination } from "./Pagination";
import { ViewMode } from "@/lib/types";
import { ChevronDown, Loader2, CircleAlert, Ellipsis } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MasonryGrid } from "@/components/masonry/MasonryGrid";
import { PhotoProvider } from "react-photo-view";
import { PhotoToolbar } from "@/components/file-card/FileImagePreview";

function FileViewRenderer({
  viewMode,
  files,
}: {
  viewMode: ViewMode;
  files: any[];
}) {
  if (viewMode === ViewMode.Grid) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-[repeat(auto-fill,minmax(224px,1fr))]">
        {files.map((file) => (
          <FileCard key={file.name} file={file} />
        ))}
      </div>
    );
  }

  if (viewMode === ViewMode.Masonry) {
    return (
      <div className="w-full min-w-0">
        <MasonryGrid files={files} />
      </div>
    );
  }

  // 列表模式
  return (
    <div className="space-y-2">
      {files.map((file) => (
        <FileCard key={file.name} file={file} listView />
      ))}
    </div>
  );
}

export function FileGallery() {
  const viewMode = useActiveViewMode();
  const { itemsPerPage, setItemsPerPage, currentPage, setCurrentPage } = useFileUIStore();
  const { fetchNextPage } = useFileDataStore();
  const galleryTopRef = useRef<HTMLDivElement>(null);
  const masonryLoadMoreRef = useRef<HTMLDivElement>(null);
  const masonryLoadingRef = useRef(false);
  const {
    searchQuery,
    filterLiked,
    filterTags,
    filterDateRange,
    sortType,
    sortOrder,
  } = useFileQueryStore();
  const files = useActiveItems();
  const bucket = useActiveBucket();
  const listQuery = useMemo(() => ({
    search: searchQuery.trim() || undefined,
    liked: filterLiked ? "true" : undefined,
    tags: filterTags.length > 0 ? filterTags.join(",") : undefined,
    dateStart: filterDateRange.start?.toString(),
    dateEnd: filterDateRange.end?.toString(),
    sortType,
    sortOrder,
  }), [filterDateRange.end, filterDateRange.start, filterLiked, filterTags, searchQuery, sortOrder, sortType]);

  // 查询条件变化时，重置页码并让服务端按 D1 条件重新拉第一页。
  useEffect(() => {
    setCurrentPage(0);
    void fetchNextPage(listQuery);
  }, [fetchNextPage, listQuery, setCurrentPage]);

  const scrollToGalleryTop = useCallback(() => {
    galleryTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handlePageChange = async (selectedItem: { selected: number }) => {
    const nextPage = selectedItem.selected;
    const nextPageOffset = nextPage * itemsPerPage;
    if (nextPageOffset >= files.length && bucket.hasMore && !bucket.loading) {
      await fetchNextPage(listQuery);
    }
    setCurrentPage(nextPage);
    scrollToGalleryTop();
  };

  const handleItemsPerPageChange = (size: number) => {
    setItemsPerPage(size);
    setCurrentPage(0);
    void fetchNextPage(listQuery);
    scrollToGalleryTop();
  };

  const handleGalleryLoadMore = async () => {
    await fetchNextPage(listQuery);
    scrollToGalleryTop();
  };

  const handleMasonryLoadMore = useCallback(async () => {
    if (masonryLoadingRef.current || bucket.loading || (!bucket.hasMore && !bucket.error)) {
      return;
    }

    masonryLoadingRef.current = true;
    const anchor = masonryLoadMoreRef.current;
    const topBefore = anchor?.getBoundingClientRect().top;

    try {
      await fetchNextPage(listQuery);
    } finally {
      masonryLoadingRef.current = false;
    }

    if (topBefore === undefined || !anchor) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const topAfter = anchor.getBoundingClientRect().top;
        window.scrollBy({ top: topAfter - topBefore, behavior: "instant" });
      });
    });
  }, [bucket.error, bucket.hasMore, bucket.loading, fetchNextPage, listQuery]);

  const offset = currentPage * itemsPerPage;
  const currentFiles =
    viewMode === ViewMode.Masonry
      ? files
      : files.slice(offset, offset + itemsPerPage);

  return (
    <PhotoProvider
      maskOpacity={0.85}
      toolbarRender={(props) => <PhotoToolbar {...props} />}
    >
      <div ref={galleryTopRef} className="flex items-center justify-between mb-6 scroll-mt-20">
        <div className="flex items-center gap-2 text-sm text-foreground/50">
          <span>{files.length} 个文件</span>
          {viewMode !== ViewMode.Masonry && bucket.hasMore && (
            <Button
              onClick={handleGalleryLoadMore}
              disabled={bucket.loading || bucket.error}
              variant="ghost"
              size="sm"
              title={bucket.loading ? "加载中" : bucket.error ? "加载失败" : "加载更多"}
              className="h-8 w-8 p-0 border-primary/30 text-primary hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {bucket.loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : bucket.error ? (
                <CircleAlert className="h-4 w-4" />
              ) : (
                <Ellipsis className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <FilterDropdown />
          <SortTypeDropdown />
          <ViewModeToggle />
        </div>
      </div>

      <FileViewRenderer viewMode={viewMode} files={currentFiles} />

      {viewMode !== ViewMode.Masonry && (
        <Pagination
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          hasMore={bucket.hasMore}
          loading={bucket.loading}
          error={bucket.error}
          onPageChange={handlePageChange}
          onLoadMore={handleGalleryLoadMore}
          loadedItems={files.length}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}

      {viewMode === ViewMode.Masonry && (bucket.hasMore || bucket.error) && (
        <div ref={masonryLoadMoreRef} className="flex justify-center py-8">
          <button
            onClick={handleMasonryLoadMore}
            disabled={bucket.loading}
            className="px-6 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title={bucket.loading ? "加载中" : bucket.error ? "加载失败" : "加载更多"}
          >
            {bucket.loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : bucket.error ? (
              <CircleAlert className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      )}
    </PhotoProvider>
  );
}

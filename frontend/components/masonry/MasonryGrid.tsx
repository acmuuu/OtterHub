"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MasonryImageCard } from "@/components/masonry/MasonryImageCard";
import { FileItem } from "@shared/types";

interface MasonryGridProps {
  files: FileItem[];
  columnGutter?: number;
}

/** 较原尺寸约 0.7 倍，预览卡片约小 30% */
const RESPONSIVE_COLUMN_WIDTHS = {
  mobile: 126, // < 640px
  tablet: 168, // 640px - 1024px
  desktop: 210, // > 1024px
} as const;

export function MasonryGrid({
  files,
  columnGutter = 16,
}: MasonryGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columnWidth, setColumnWidth] = useState<number>(
    RESPONSIVE_COLUMN_WIDTHS.desktop,
  );
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 640) setColumnWidth(RESPONSIVE_COLUMN_WIDTHS.mobile);
      else if (w < 1024) setColumnWidth(RESPONSIVE_COLUMN_WIDTHS.tablet);
      else setColumnWidth(RESPONSIVE_COLUMN_WIDTHS.desktop);
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const update = () => setContainerWidth(node.clientWidth);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  const columnCount = useMemo(() => {
    if (containerWidth <= 0) return 1;
    return Math.max(
      1,
      Math.floor((containerWidth + columnGutter) / (columnWidth + columnGutter)),
    );
  }, [columnGutter, columnWidth, containerWidth]);

  const columns = useMemo(() => {
    const nextColumns = Array.from({ length: columnCount }, () => [] as FileItem[]);

    files.forEach((file, index) => {
      nextColumns[index % columnCount].push(file);
    });

    return nextColumns;
  }, [columnCount, files]);

  return (
    <div
      ref={containerRef}
      className="grid w-full"
      style={{
        gap: columnGutter,
        gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
      }}
    >
      {columns.map((column, columnIndex) => (
        <div
          key={columnIndex}
          className="flex min-w-0 flex-col"
          style={{ gap: columnGutter }}
        >
          {column.map((file) => (
            <MasonryImageCard key={file.name} file={file} />
          ))}
        </div>
      ))}
    </div>
  );
}

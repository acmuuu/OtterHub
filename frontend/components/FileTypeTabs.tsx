"use client";

import { Button } from "@/components/ui/button";
import { useFileDataStore } from "@/stores/file";
import { FILE_TYPE_FILTER_OPTIONS } from "@/lib/file-type-options";

type FileTypeTabsProps = {
  /** 紧凑行高（如矮 header） */
  compact?: boolean;
};

export function FileTypeTabs({ compact = false }: FileTypeTabsProps) {
  const activeType = useFileDataStore((s) => s.activeType);
  const setActiveType = useFileDataStore((s) => s.setActiveType);

  return (
    <div className={compact ? "flex items-center gap-1 flex-nowrap" : "flex items-center gap-2 flex-wrap"}>
      {FILE_TYPE_FILTER_OPTIONS.map((type) => {
        const Icon = type.icon;

        return (
          <Button
            key={type.id}
            variant="ghost"
            size="sm"
            onClick={() => setActiveType(type.id)}
            className={`
              transition-all duration-200
              ${compact ? "h-7 px-1.5 text-[11px] font-medium py-0" : ""}
              ${
                activeType === type.id
                  ? "bg-primary/20 text-primary border border-primary/50"
                  : "text-foreground/80 hover:text-foreground hover:bg-secondary/50"
              }
            `}
          >
            {Icon && <Icon className={compact ? "h-3 w-3 mr-1 shrink-0" : "h-4 w-4 mr-2"} />}
            {type.label}
          </Button>
        );
      })}
    </div>
  );
}

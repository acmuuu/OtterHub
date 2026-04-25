"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FILE_TYPE_FILTER_OPTIONS } from "@/lib/file-type-options";
import { fileTypeToPathSegment } from "@/lib/file-type-routes";
import { cn } from "@/lib/utils";

type FileTypeTabsProps = {
  /** 紧凑行高（如矮 header） */
  compact?: boolean;
};

export function FileTypeTabs({ compact = false }: FileTypeTabsProps) {
  const pathname = usePathname();

  return (
    <div className={compact ? "flex items-center gap-1 flex-nowrap" : "flex items-center gap-2 flex-wrap"}>
      {FILE_TYPE_FILTER_OPTIONS.map((type) => {
        const Icon = type.icon;
        const path = fileTypeToPathSegment(type.id);
        const href = path ? `/${path}` : "/";
        const isActive = pathname === href;

        return (
          <Button
            key={type.id}
            asChild
            variant="ghost"
            size="sm"
            className={cn(
              "transition-all duration-200",
              compact && "h-7 px-1.5 text-[11px] font-medium py-0",
              isActive
                ? "bg-primary/20 text-primary border border-primary/50"
                : "text-foreground/80 hover:text-foreground hover:bg-secondary/50",
            )}
          >
            <Link href={href} prefetch>
              {Icon && <Icon className={compact ? "h-3 w-3 mr-1 shrink-0" : "h-4 w-4 mr-2"} />}
              {type.label}
            </Link>
          </Button>
        );
      })}
    </div>
  );
}

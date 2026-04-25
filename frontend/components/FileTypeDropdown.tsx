"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFileDataStore } from "@/stores/file";
import { cn } from "@/lib/utils";
import { FILE_TYPE_FILTER_OPTIONS } from "@/lib/file-type-options";

type FileTypeDropdownProps = {
  /** 紧凑行高（如矮 header） */
  compact?: boolean;
};

export function FileTypeDropdown({ compact = false }: FileTypeDropdownProps) {
  const activeType = useFileDataStore((s) => s.activeType);
  const setActiveType = useFileDataStore((s) => s.setActiveType);

  const currentType = FILE_TYPE_FILTER_OPTIONS.find((type) => type.id === activeType);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "text-foreground/80 hover:text-foreground hover:bg-secondary/60 data-[state=open]:bg-secondary/60",
            compact ? "h-6 gap-1 px-1.5 text-xs py-0" : "gap-2",
          )}
        >
          {currentType?.icon && (
            <currentType.icon
              className={cn("text-foreground/80", compact ? "h-3 w-3" : "h-4 w-4")}
            />
          )}
          {currentType?.label}
          <ChevronDown className={compact ? "h-3 w-3" : "h-4 w-4"} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="
          min-w-40
          rounded-lg
          border border-glass-border
          bg-glass-bg
          backdrop-blur-md
          shadow-lg
        "
      >
        {FILE_TYPE_FILTER_OPTIONS.map((type) => {
          const Icon = type.icon;

          return (
            <DropdownMenuItem
              key={type.id}
              onClick={() => setActiveType(type.id)}
              className={`
                flex items-center gap-2
                rounded-md
                px-2 py-1.5
                text-sm
                transition-colors

                ${
                  activeType === type.id
                    ? "bg-primary/15 text-primary"
                    : "text-foreground/80"
                }

                hover:bg-secondary/60
                hover:text-foreground

                focus:bg-secondary/60
                focus:text-foreground
              `}
            >
              <Icon className="h-4 w-4 mr-2 text-foreground/60" />
              {type.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

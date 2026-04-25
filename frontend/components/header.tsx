"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, X, Settings2 } from "lucide-react";
import { useFileQueryStore } from "@/stores/file";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { Button } from "./ui/button";
import { FileTypeDropdown } from "./FileTypeDropdown";
import { FileTypeTabs } from "./FileTypeTabs";
import { Input } from "./ui/input";
import { APP_NAME, APP_CATEGORY } from "@/lib/ui-text";
import { cn } from "@/lib/utils";

export function Header() {
  const { searchQuery, setSearchQuery } = useFileQueryStore();
  const isMobile = useIsMobile();
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // 移动端头部导航栏
  if (isMobile) {
    return (
      <header className="sticky top-0 z-40 w-full border-b border-glass-border bg-glass-bg/80 backdrop-blur-xl">
        <div
          className={cn(
            "flex w-full items-center px-6 md:px-8",
            showMobileSearch ? "min-h-[45px] py-0.5" : "h-[45px]",
          )}
        >
          {showMobileSearch ? (
            <div className="flex w-full items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/40" />
                <Input
                  autoFocus
                  placeholder="搜索文件..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-7 w-full pl-8 pr-8 bg-secondary/30 border-glass-border rounded-xl focus-visible:ring-primary/40 placeholder:text-foreground/50 text-sm"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-0.5 top-1/2 -translate-y-1/2 h-6 w-6 text-foreground/40 hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <Button variant="ghost" onClick={() => { setShowMobileSearch(false); setSearchQuery(""); }} className="h-7 px-2 text-xs font-semibold text-primary">取消</Button>
            </div>
          ) : (
            <div className="flex w-full items-center justify-between animate-in fade-in duration-300">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="relative h-6 w-6 shrink-0">
                  <Image
                    src="/otterhub-icon.svg"
                    alt=""
                    width={24}
                    height={24}
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <span className="text-base font-bold tracking-tight text-foreground truncate leading-none">{APP_NAME}</span>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <FileTypeDropdown compact />
                <Button variant="ghost" size="icon" onClick={() => setShowMobileSearch(true)} className="h-6 w-6 text-foreground/70 rounded-lg p-0"><Search className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-foreground/70 rounded-lg p-0" asChild>
                  <Link href="/settings" aria-label="偏好设置" prefetch>
                    <Settings2 className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>
    );
  }

  // 桌面端头部导航栏
  return (
    <header className="sticky top-0 z-40 w-full border-b border-glass-border bg-glass-bg/70 backdrop-blur-xl">
      <div className="flex h-[45px] w-full items-center gap-2 px-6 md:px-8">
        {/* Left: Logo */}
        <div
          className="flex items-center gap-2 group cursor-pointer shrink-0 min-w-0"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <div className="relative h-7 w-7 shrink-0">
            <Image
              src="/otterhub-icon.svg"
              alt=""
              width={28}
              height={28}
              className="object-contain"
              unoptimized
            />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-foreground leading-none">{APP_NAME}</h1>
            <p className="sr-only">{APP_CATEGORY}</p>
          </div>
        </div>

        {/* 右侧：搜索框 → 类型标签 → 开关 */}
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 pl-1">
          <div className="relative group hidden min-w-0 shrink-0 xl:block">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/30 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="搜索文件..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 w-52 md:w-56 rounded-lg border-glass-border bg-secondary/20 pl-8 pr-8 text-xs focus-visible:ring-primary/40 placeholder:text-foreground/80"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchQuery("")}
                className="absolute right-0.5 top-1/2 -translate-y-1/2 h-6 w-6 text-foreground/30 hover:text-foreground p-0"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <div className="min-w-0 max-w-full overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <FileTypeTabs compact />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-foreground/70 hover:text-foreground"
            asChild
          >
            <Link href="/settings" aria-label="偏好设置" prefetch>
              <Settings2 className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
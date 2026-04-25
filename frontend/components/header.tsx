"use client";

import Image from "next/image";
import { Search, X, Settings2 } from "lucide-react";
import { useFileQueryStore } from "@/stores/file";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { Button } from "./ui/button";
import { FileTypeDropdown } from "./FileTypeDropdown";
import { FileTypeTabs } from "./FileTypeTabs";
import { ImageLoadModeToggle } from "./ImageLoadModeToggle";
import { SafeModeToggle } from "./SafeModeToggle";
import { ThemeToggle } from "./ThemeToggle";
import { Input } from "./ui/input";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
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
            "flex items-center px-3",
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
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-foreground/70 rounded-lg p-0"><Settings2 className="h-3.5 w-3.5" /></Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="rounded-t-[2.5rem] border-glass-border bg-popover/95 backdrop-blur-2xl pb-12 px-8">
                    <SheetHeader className="mb-2 pt-2">
                      <div className="mx-auto w-12 h-1.5 rounded-full bg-foreground/10 mb-6" />
                      <SheetTitle className="text-xl font-bold text-foreground flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10"><Settings2 className="h-5 w-5 text-primary" /></div>
                        偏好设置
                      </SheetTitle>
                    </SheetHeader>
                    <div className="space-y-8">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1"><p className="text-base font-semibold text-foreground">安全模式</p><p className="text-xs text-foreground/50">遮罩敏感内容 (NSFW)</p></div>
                        <SafeModeToggle />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1"><p className="text-base font-semibold text-foreground">图片加载</p><p className="text-xs text-foreground/50">根据网络自动调整质量</p></div>
                        <ImageLoadModeToggle />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1"><p className="text-base font-semibold text-foreground">深色模式</p><p className="text-xs text-foreground/50">随系统自动切换主题</p></div>
                        <ThemeToggle />
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
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
      <div className="mx-auto flex h-[45px] max-w-7xl items-center gap-2 px-3 md:px-4">
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
          <div className="flex shrink-0 items-center gap-0.5 rounded-xl bg-secondary/10 p-0.5 border border-glass-border [&_button]:!h-6 [&_button]:!w-6 [&_button]:!min-h-0 [&_button_svg]:!h-3.5 [&_button_svg]:!w-3.5">
            <SafeModeToggle />
            <ImageLoadModeToggle />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
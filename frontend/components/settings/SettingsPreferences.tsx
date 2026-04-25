"use client";

import { SafeModeToggle } from "@/components/SafeModeToggle";
import { ImageLoadModeToggle } from "@/components/ImageLoadModeToggle";
import { ThemeToggle } from "@/components/ThemeToggle";

export function SettingsPreferences() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="text-base font-semibold text-foreground">安全模式</p>
          <p className="text-xs text-foreground/50">遮罩敏感内容 (NSFW)</p>
        </div>
        <SafeModeToggle />
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="text-base font-semibold text-foreground">图片加载</p>
          <p className="text-xs text-foreground/50">根据网络自动调整质量</p>
        </div>
        <ImageLoadModeToggle />
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="text-base font-semibold text-foreground">深色模式</p>
          <p className="text-xs text-foreground/50">随系统自动切换主题</p>
        </div>
        <ThemeToggle />
      </div>
    </div>
  );
}

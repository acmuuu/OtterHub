"use client";

import { LayoutGrid, Image as ImageIcon, Settings, Share2, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShareTab } from "./share-tab/ShareTab";
import { useUIStore } from "@/stores/ui-store";
import { SettingTab } from "@/lib/types/settings";
import { WallpaperTab } from "./wallpaper-tab/WallpaperTab";
import { GeneralTab } from "./general-tab/GeneralTab";
import { SettingsPreferences } from "./SettingsPreferences";

const menuItems = [
  { id: SettingTab.Display, label: "显示与偏好", icon: SlidersHorizontal, color: "text-amber-500" },
  { id: SettingTab.General, label: "常规设置", icon: Settings, color: "text-slate-500" },
  { id: SettingTab.Wallpaper, label: "随机壁纸", icon: ImageIcon, color: "text-sky-500" },
  { id: SettingTab.Share, label: "分享管理", icon: Share2, color: "text-emerald-500" },
];

/**
 * 原 SettingsDialog 内层：侧边栏 + 各 Tab（全页与弹窗共用布局）
 */
export function SystemSettingsView({ className }: { className?: string }) {
  const activeTab = useUIStore((state) => state.activeSettingTab);
  const setActiveTab = useUIStore((state) => state.setActiveSettingTab);

  return (
    <div
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-background/95 shadow-2xl backdrop-blur-2xl",
        "h-[min(90vh,720px)] min-h-0 sm:h-[min(90vh,800px)]",
        className,
      )}
    >
      <div className="shrink-0 border-b border-border/40 bg-muted/20 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="rounded-xl bg-primary/10 p-2 shadow-inner">
            <Settings className="h-4 w-4 animate-spin-slow text-primary" />
          </div>
          <h2 className="text-base font-bold tracking-tight sm:text-lg">系统设置</h2>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        <aside className="flex w-full shrink-0 flex-row gap-2 overflow-x-auto border-b border-border/40 bg-muted/5 p-2 px-3 [scrollbar-width:none] [-ms-overflow-style:none] md:w-20 md:flex-col md:overflow-y-auto md:border-b-0 md:border-r md:p-2 md:pl-2 lg:w-52 lg:gap-2 lg:px-4 [&::-webkit-scrollbar]:hidden">
          {menuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              title={item.label}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "group relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl text-xs font-semibold transition-all",
                "gap-2 md:gap-0 lg:gap-3",
                "w-auto px-3 py-2 md:w-full md:px-0 md:py-4 lg:justify-start lg:px-4 lg:py-3",
                "md:text-sm",
                activeTab === item.id
                  ? "scale-[1.02] bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon
                className={cn(
                  "h-4 w-4 transition-transform group-hover:scale-110",
                  activeTab === item.id ? "text-primary-foreground" : item.color,
                )}
              />
              <span className="whitespace-nowrap md:hidden lg:inline">{item.label}</span>
            </button>
          ))}
        </aside>

        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-background/50 p-3 md:p-6 lg:p-8">
          <div className="min-h-0">
            {activeTab === SettingTab.Display && <SettingsPreferences />}
            {activeTab === SettingTab.Wallpaper && <WallpaperTab />}
            {activeTab === SettingTab.General && <GeneralTab />}
            {activeTab === SettingTab.Share && <ShareTab />}
            {activeTab !== SettingTab.Display &&
              activeTab !== SettingTab.Wallpaper &&
              activeTab !== SettingTab.General &&
              activeTab !== SettingTab.Share && (
                <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-muted-foreground/20">
                  <div className="mb-4 rounded-full border border-dashed border-border/50 bg-muted/30 p-8">
                    <LayoutGrid className="h-16 w-16" />
                  </div>
                  <p className="text-sm font-bold uppercase tracking-widest">功能开发中</p>
                </div>
              )}
          </div>
        </main>
      </div>
    </div>
  );
}

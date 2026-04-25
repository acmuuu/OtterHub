"use client";

import { SystemSettingsView } from "@/components/settings/SystemSettingsView";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function SettingsPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-linear-to-br from-gradient-from via-gradient-via to-gradient-to">
      <div className="absolute top-[-10%] left-[-10%] z-0 h-[40%] w-[40%] animate-pulse rounded-full bg-primary/20 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] z-0 h-[40%] w-[40%] animate-pulse rounded-full bg-accent/20 blur-[120px] delay-700" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <Header />

        <main className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col p-6 md:p-8">
          <div className="min-h-0 flex-1 pb-2">
            <SystemSettingsView className="w-full" />
          </div>
        </main>

        <div className="relative opacity-60 transition-opacity hover:opacity-100">
          <Footer />
        </div>
      </div>
    </div>
  );
}

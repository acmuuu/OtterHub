"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_FILE_TYPE_PATH } from "@/lib/file-type-routes";

/** 主入口重定向到默认类型，各类型有独立URL（见 /[type]） */
export default function HomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/${DEFAULT_FILE_TYPE_PATH}`);
  }, [router]);

  return <div className="min-h-screen bg-background" aria-hidden />;
}

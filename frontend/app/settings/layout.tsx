import type { ReactNode } from "react";
import { APP_NAME } from "@/lib/ui-text";

export const metadata = {
  title: `设置 - ${APP_NAME}`,
};

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return children;
}

"use client";

import { Progress } from "@/components/ui/progress";

type FileUploadProgressProps = {
  uploadProgress: Record<string, number>;
};

export function FileUploadZone({ uploadProgress }: FileUploadProgressProps) {
  if (Object.keys(uploadProgress).length === 0) return null;

  return (
    <div className="mb-6 space-y-2">
      {Object.entries(uploadProgress).map(([k, v]) => (
        <div
          key={k}
          className="bg-secondary/30 p-3 rounded-lg border border-glass-border"
        >
          <div className="flex justify-between text-xs mb-1 text-foreground/80">
            <span>Uploading</span>
            <span>{v}%</span>
          </div>
          <Progress value={v} className="h-1" />
        </div>
      ))}
    </div>
  );
}

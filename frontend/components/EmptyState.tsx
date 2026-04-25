import Image from "next/image";
import { Upload } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="relative mb-6 h-32 w-32 opacity-50">
        <Image
          src="/otterhub-icon.svg"
          alt=""
          width={128}
          height={128}
          className="object-contain"
          unoptimized
        />
      </div>
      <h3 className="text-2xl font-semibold text-foreground mb-2">暂无文件</h3>
      <p className="text-foreground/60 max-w-md mb-6">
        将文件拖放到页面任意位置，或打开右下角菜单，点击
        <span className="text-foreground/80">绿色「上传」</span>按钮以选择文件。
      </p>
      <div className="flex items-center gap-2 text-sm text-primary">
        <Upload className="h-4 w-4" />
        <span>支持图片、音频、视频与文档</span>
      </div>
    </div>
  )
}

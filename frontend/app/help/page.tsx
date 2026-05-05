import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  FileType,
  MAX_CHUNK_NUM,
  MAX_CHUNK_SIZE,
  MAX_FILE_SIZE,
} from "@shared/types";
import { APP_NAME } from "@/lib/ui-text";

export const metadata: Metadata = {
  title: `API · 上传说明 · ${APP_NAME}`,
  description: `${APP_NAME} 上传接口：鉴权方式、单次上传、URL 拉取与分片上传，以及文件类型前缀说明（含仅供 API 的 other）`,
};

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-md bg-muted/80 px-1.5 py-0.5 font-mono text-[0.9em] text-foreground/90">
      {children}
    </code>
  );
}

function Pre({ children }: { children: React.ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-glass-border bg-secondary/35 p-4 text-xs leading-relaxed text-foreground/90 [&_code]:rounded-none [&_code]:bg-transparent [&_code]:px-0 [&_code]:py-0">
      {children}
    </pre>
  );
}

const chunkMb = MAX_CHUNK_SIZE / (1024 * 1024);
const maxTotalGb =
  MAX_FILE_SIZE / (1024 * 1024 * 1024) >= 1
    ? `${(MAX_FILE_SIZE / (1024 * 1024 * 1024)).toFixed(0)}`
    : `${(MAX_FILE_SIZE / (1024 * 1024 * 1024)).toFixed(2)}`;

export default function ApiHelpPage() {
  const multipartExample = [
    "# 将下列 URL 中的主机名换为你的站点，例如 https://files.0iw.com",
    "",
    `curl -X POST "https://files.0iw.com/upload" \\`,
    '  -H "Authorization: Bearer YOUR_API_TOKEN" \\',
    "  -F \"file=@./photo.jpg\" \\",
    `  -F \"fileType=${FileType.Image}\" \\`,
    "  -F 'tags=[]' \\",
    '  -F "nsfw=false"',
  ].join("\n");

  const byUrlExample = [
    `curl -X POST "https://files.0iw.com/upload/by-url" \\`,
    '  -H "Authorization: Bearer YOUR_API_TOKEN" \\',
    '  -H "Content-Type: application/json" \\',
    `  -d '{"url":"https://example.com/a.bin","fileName":"a.bin","fileType":"${FileType.Document}","tags":[],"isNsfw":false}'`,
  ].join("\n");

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-10 md:px-8 md:pt-14">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          返回首页
        </Link>

        <header className="mt-8 space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">上传 API 说明</h1>
          <p className="text-muted-foreground leading-relaxed">
            以下为与浏览器同源的后端路由（例如在{" "}
            <Code>files.0iw.com</Code> 上使用时，请求的绝对地址前缀为{" "}
            <Code>https://files.0iw.com</Code>
            ）。所有 <Code>/upload</Code>
            接口均需登录 Cookie，或使用环境变量配置的{" "}
            <Code>API_TOKEN</Code>：<Code>Authorization: Bearer …</Code>
          </p>
        </header>

        <section className="mt-12 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">文件类型前缀</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            存储 key 使用类型前缀：<Code>img</Code> / <Code>audio</Code> /
            <Code>video</Code> / <Code>doc</Code> /
            <Code>{FileType.Other}</Code>。
            前四类在不传 <Code>fileType</Code>{" "}
            时一般由 MIME 与扩展名推断。
            <Code>{FileType.Other}</Code>{" "}
            仅能通过请求显式指定，服务端<strong>不会</strong>自动推断；
            适合 API 存档、不占网页四个主分类列表展示的文件。
            客户端若只有{" "}
            <Code>application/octet-stream</Code>{" "}
            等泛型 MIME，可对前四类显式传入 <Code>fileType</Code>
            ，或为冷数据传入 <Code>{FileType.Other}</Code>。
          </p>
          <div className="overflow-hidden rounded-xl border border-glass-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">请求值</th>
                  <th className="px-4 py-2 font-medium">含义</th>
                  <th className="px-4 py-2 font-medium hidden sm:table-cell">存储 key 示例</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-glass-border">
                  <td className="px-4 py-2 font-mono text-xs">{FileType.Image}</td>
                  <td className="px-4 py-2">图片</td>
                  <td className="px-4 py-2 font-mono text-[11px] text-muted-foreground hidden sm:table-cell">
                    img:{'<id>'}.jpg
                  </td>
                </tr>
                <tr className="border-t border-glass-border">
                  <td className="px-4 py-2 font-mono text-xs">{FileType.Audio}</td>
                  <td className="px-4 py-2">音频</td>
                  <td className="px-4 py-2 font-mono text-[11px] text-muted-foreground hidden sm:table-cell">
                    audio:{'<id>'}.mp3
                  </td>
                </tr>
                <tr className="border-t border-glass-border">
                  <td className="px-4 py-2 font-mono text-xs">{FileType.Video}</td>
                  <td className="px-4 py-2">视频</td>
                  <td className="px-4 py-2 font-mono text-[11px] text-muted-foreground hidden sm:table-cell">
                    video:{'<id>'}.mp4
                  </td>
                </tr>
                <tr className="border-t border-glass-border">
                  <td className="px-4 py-2 font-mono text-xs">{FileType.Document}</td>
                  <td className="px-4 py-2">文档及其他</td>
                  <td className="px-4 py-2 font-mono text-[11px] text-muted-foreground hidden sm:table-cell">
                    doc:{'<id>'}.pdf
                  </td>
                </tr>
                <tr className="border-t border-glass-border">
                  <td className="px-4 py-2 font-mono text-xs">{FileType.Other}</td>
                  <td className="px-4 py-2">其他（仅 API，网页主页四分类不展示）</td>
                  <td className="px-4 py-2 font-mono text-[11px] text-muted-foreground hidden sm:table-cell">
                    other:{'<id>'}.bin
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            分片初始化接口同样需要有效的 <Code>fileType</Code>。
          </p>
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">
            <Code>POST /upload</Code> 单次 multipart 上传
          </h2>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground marker:text-primary/70">
            <li>
              表单字段：<Code>file</Code>（必填）、<Code>nsfw</Code>{" "}
              （<Code>true</Code>/<Code>false</Code>
              ，默认不按 NSFW 打标）、
              <Code>tags</Code>{" "}
              （JSON 字符串数组，允许的值为 <Code>nsfw</Code>、
              <Code>private</Code>）。
            </li>
            <li>
              <Code>fileType</Code>（可选）：<Code>img</Code> /
              <Code>audio</Code> /
              <Code>video</Code> /
              <Code>doc</Code> /
              <Code>{FileType.Other}</Code>；
              不传则按 MIME/扩展名<strong>仅可对前四类</strong>推断，不会得到{" "}
              <Code>{FileType.Other}</Code>。
            </li>
            <li>
              成功时 <Code>data</Code>{" "}
              为 JSON 对象，含 <Code>key</Code>、<Code>fileName</Code>、
              <Code>fileSize</Code>、<Code>uploadedAt</Code>、可直接打开的{" "}
              <Code>urlLong</Code>（对完整 KV key 路径编码）；若已绑定 D1
              并分配短链则有 <Code>urlShort</Code>{" "}
              （<Code>/file/&#123;shortId&#125;</Code>）、根路径跳转{" "}
              <Code>shortLink</Code>{" "}
              （<Code>/&#123;shortId&#125;</Code>）
              与 <Code>shortId</Code>；无 D1 时后三项多为 <Code>null</Code>。
            </li>
          </ul>
          <Pre>
            <code>{multipartExample}</code>
          </Pre>
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">
            <Code>POST /upload/by-url</Code> JSON 拉取远端
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            服务端代拉指定 URL；可补 <Code>fileName</Code>；
            <Code>isNsfw</Code> 与 <Code>tags</Code>{" "}
            规则同上。亦可传 <Code>fileType</Code>。
            成功时 <Code>data</Code>{" "}
            与 <Code>POST /upload</Code>{" "}
            相同（结构化对象含 <Code>urlLong</Code>、<Code>urlShort</Code>{" "}
            等）。
          </p>
          <Pre>
            <code>{byUrlExample}</code>
          </Pre>
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">分片上传</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            适用于大文件。单片片长不超过约 {chunkMb}{" "}
            MB（与 Telegram 单文件上限一致）；总分片不超过 {MAX_CHUNK_NUM}{" "}
            片，总大小上限约 {maxTotalGb}{" "}
            GB。
          </p>
          <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground marker:text-primary/70">
            <li>
              <Code>POST /upload/chunk/init</Code>
              ，JSON：<Code>fileType</Code>、<Code>fileName</Code>、
              <Code>fileSize</Code>、<Code>totalChunks</Code>
              ，可选 <Code>tags</Code>
              ，返回字符串 <Code>key</Code>。
            </li>
            <li>
              对每个索引 <Code>chunkIndex</Code>：<Code>POST /upload/chunk</Code>
              ，multipart：<Code>key</Code>、<Code>chunkIndex</Code>、
              <Code>chunkFile</Code>。
            </li>
            <li>
              <Code>GET /upload/chunk/progress?key=…</Code>{" "}
              查询已上传的分片序号与完成状态。
            </li>
          </ol>
        </section>

        <section className="mt-12 rounded-xl border border-glass-border bg-secondary/25 p-4 text-sm text-muted-foreground leading-relaxed">
          <strong className="font-medium text-foreground">备注</strong>：若开启{" "}
          Telegram 存储，所选 <Code>fileType</Code>{" "}
          会映射到对应的 Bot API（如图片走{" "}
          <Code>sendPhoto</Code>）。
          <Code>doc</Code> {" "}
          始终走文档接口；内容与类型严重不符时远端可能报错，请以实际 MIME / 后缀为准自行选用合适类型。
        </section>
      </main>
    </div>
  );
}

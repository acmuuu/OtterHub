# OtterHub

<p align="center">
  <img width="100" alt="OtterHub icon" src="public/otterhub-icon.svg">
</p>
<p align="center"><strong>Stash your files like an otter</strong></p>

<p align="center">
  基于 Cloudflare D1 + KV 与 Telegram Bot API 的免费私人云盘
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Cloudflare-Pages%20%2B%20D1%20%2B%20KV%20%2B%20R2-orange?logo=cloudflare" />
  <img src="https://img.shields.io/badge/Storage-Telegram-blue?logo=telegram" />
  <img src="https://img.shields.io/badge/Frontend-Next.js-black?logo=next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript" />
</p>

---

## 👋 为什么有 OtterHub？

现有基于 **Cloudflare + Telegram** 的文件存储方案，例如：

- [Telegraph-Image](https://github.com/cf-pages/Telegraph-Image) 
- [CloudFlare-ImgBed](https://github.com/MarSeventh/CloudFlare-ImgBed)

它们都很优秀，但要么偏向**图床与轻量分享**，要么为了通用性引入了**较高的复杂度**，并不完全适合**长期自用的私人云盘**。

### OtterHub 的定位

> 像水獭一样，把文件悄悄藏好，需要时再拿出来 🦦

OtterHub 是一个 **为个人使用场景定制** 的私人云盘方案：

- 基于 **Cloudflare Pages**；**D1 (SQLite)** 存文件元数据与列表索引，**KV** 存分片/临时数据与 key–value 配置，二者配合
- 使用 **Telegram Bot** 作为生产环境实际文件存储（本地开发默认用 **R2**）
- 通过 **分片上传** 突破 20MB 单文件限制
- 支持 **HTTP Range**，适合视频 / 大文件访问
- 为每个文件维护 **短链 `short_id`**（存于 D1），支持根路径 `/{shortId}` 跳转到文件访问
- 架构克制、状态最小化，优先长期可维护性

它不追求"什么都支持"，而是专注于**刚好够用、稳定、好维护**。


>  [!IMPORTANT]
> 体验站点：[OtterHub Demo](https://otterhub-demo.pages.dev/)
>
> 账号：`OtterHub` | 密码：`123456`
>
> 限制：演示站的默认文件不可删，仅支持上传 ≤20MB 文件（1 小时自动清理）


## ✨ 核心能力

- **私人文件存储**：
  - 支持图片 / 音频 / 视频 / 文档
  - KV 中 key 仍按类型划分前缀 `img:` `audio:` `video:` `doc:`，与 D1 中的 `file_type` 一致
  - 提供回收站（30 天后自动清除），支持恢复与永久删除
- **列表与检索（推荐配置 D1）**：
  - 配置 **D1** 后，列表走 SQL：搜索、多标签筛选、收藏、日期范围、按名称/大小/上传时间排序、游标分页
  - **未配置 D1** 时回退为 KV 的 `list` 能力（无上述筛选/排序，仅基本前缀列举）
- **大文件**：
  - 分片上传（≤20MB/片），已实测稳定上传并预览 **100MB** 文件，理论最大约 **1GB**
  - 支持 HTTP Range，视频/音频按需加载，支持断点续传
- **分享**：
  - 通过 KV 存 `share:<uuid>` 元数据，支持**单文件**与**多文件打包**分享，可设过期；打包支持整包 **ZIP** 下载
- **实时预览**：
  - 通过文件 URL 直接打开
  - 支持：图片 / 音频 / 视频 / 文本（txt、pdf 等）
- **性能与流量**：
  - 非 Range 请求走 Cloudflare Cache，Range 请求直出避免缓存污染
  - 图片加载策略：默认 / 省流（>5MB 不加载）/ 无图
- **安全与私密**：
  - 密码登录（JWT + Cookie）
  - NSFW 图片客户端检测（nsfw.js），安全模式下自动遮罩
- **管理**：批量下载 / 删除，搜索 / 收藏 / 排序 / 标签
- **AI 图片分析**：上传图片后生成简要描述（需配置 Workers AI binding）；Telegram 图片会尽量用较小预览图做分析，超大原图会安全跳过
- **索引维护**（需登录）：`POST /file/index/backfill`（从 KV 回填 D1）、`POST /file/index/short-ids`（补全 `short_id`）等，便于升级或数据修复


---

## 🚀 快速开始

### 前置要求

- Node.js 18+
- Cloudflare 账号（免费，部署需要）
- Telegram Bot Token（生产默认存储需要；本地开发默认不需要）

### 本地开发

1. **安装依赖**
   ```bash
   # 在根目录运行，自动安装所有 Workspaces 依赖
   npm install
   ```

2. **启动项目**
   ```bash
   npm run dev
   ```
> 第一次启动需要构建前端 `npm run build`（生成 `frontend/out` 供 Wrangler Pages Dev 使用），后续启动直接 `npm run dev` 即可。

3. **访问网站**
   - 前端：`http://localhost:3000`
   - 后端：`http://localhost:8080` (由 Wrangler 代理)

> [!TIP]
> 开发环境默认密码为 `123456`，存储为本地 **R2**。
> 默认 `npm run dev` 未绑定 **D1**，文件列表会走 **KV 回退**；若需在本地完整验证列表/搜索/短链，可在 `wrangler pages dev` 中增加 D1 绑定（与线上一致，变量名 `oh_file_db`），并可使用仓库内 `migrations/0001_file_index.sql` 初始化表结构。

> 修改 functions 代码后，可运行 `npm run ci-test` 快速测试文件上传和下载功能是否正常。

---

## 📦 Cloudflare 部署

### 1. 创建 Pages 项目

Fork 本项目，然后在 Cloudflare Dashboard 创建 Pages 项目：

- **构建命令**: `npm install && npm run build`
- **构建输出目录**: `frontend/out`

### 2. 配置环境变量

在 Pages 项目的设置中添加以下环境变量：

```env
PASSWORD=your_password          # 密码
TG_CHAT_ID=your_tg_chat_id      # Telegram Chat ID
TG_BOT_TOKEN=your_tg_bot_token  # Telegram Bot Token
API_TOKEN=your_api_token        # (可选) 用于 API 调用的 Token
```

> `TG_CHAT_ID` 和 `TG_BOT_TOKEN` 需在 Telegram 中获取。  
> 详细流程可参考：[Telegraph-Image](https://github.com/cf-pages/Telegraph-Image)

### 3. 创建并绑定 D1 数据库

1. 在 Cloudflare Dashboard 创建 D1 数据库
2. 在 Pages 项目 **Settings → Functions → D1 database bindings** 中添加绑定，**变量名必须为 `oh_file_db`**
3. 将 `migrations/0001_file_index.sql` 应用到该数据库（Dashboard SQL 控制台或 `wrangler d1 execute`）

首次有请求时，后端也会 `CREATE TABLE IF NOT EXISTS` 与必要索引，但生产环境**建议**预先执行迁移以便结构可控。

### 4. 绑定 KV Namespace

1. 创建 KV 命名空间 `oh_file_url`
2. 绑定到 Pages 项目，**变量名** `oh_file_url`

### 5. （可选）绑定 Workers AI

启用图片自动分析：

1. **Settings → Functions → AI Bindings**
2. 添加 binding，**变量名 `AI`**

### 6. 重新部署

重试部署，使环境变量与所有绑定生效。

---

## 🔧 技术原理

### 数据分层

| 层级 | 作用 |
|------|------|
| **D1** | 每文件一行：元数据、标签、是否回收站、**short_id** 等；支撑列表、搜索、排序 |
| **KV** | 文件主 key 的 value（小文件整包或**分片**的 `file_id` 列表）、临时分片、分享令牌 `share:*` 等 |
| **Telegram / R2** | 实际字节（生产为 TG，本地为 R2） |

### 文件上传
> 以大文件分片为例

1. **初始化上传**：`GET /upload/chunk`，后端创建/预留 KV，返回文件 key
2. **分片上传**：`POST /upload/chunk`，分片暂存临时 KV（TTL 等机制见代码）
3. **异步上云**：`waitUntil` 将分片送到 Telegram，写入 `file_id`
4. **完成**：更新 KV 中的分片信息，并 **upsert D1 索引**（元数据、可选 `short_id`）

### 文件下载
> 流式 + Range

1. 从 D1 或 KV 取元数据与分片信息（**TG 适配器**优先 D1 元数据，KV value 存分片数据）
2. 从 Telegram API 流式拉取，支持 `Range` 与断点续传

### 分享与短链

- **分享链接**：`share:<token>` 存在 KV，token 为 UUID，支持单文件与打包
- **短链访问**：D1 中 `short_id` 可映射到内部 `key`；根路径 `GET /{shortId}` 会 302 到 `/file/...`（需配置 D1）

### 无 D1 时的行为

- 文件仍可上传、下载，但 **列表** 仅 KV 列举，**无** 完整搜索/排序/短链表能力
- 生产环境**强烈建议**绑定 D1

### 技术细节（与旧版纯 KV 对比）

早期仅靠 KV 列举文件，存在**最终一致性**与**无法 SQL 筛选**等限制。引入 D1 后，**元数据与列表**以 D1 为主；向 Telegram 的异步上传与较大文件的合并仍可能在上传后极短时间内与列表展示存在延迟，**刷新即可**。

---

## ❓ 常见问题

<details>
<summary>1. 上传完成后立即查看，为什么文件不完整？</summary>

分片仍在上传到 Telegram 的过程中（`waitUntil` 异步）。分片未全部就绪前，可能暂时不完整。通常 **稍等并刷新** 即可。

</details>

<details>
<summary>2. Telegram 单文件限制 20MB，OtterHub 如何支持大文件？</summary>

**分片上传 + 流式合并**：每片 ≤20MB 独立上传，服务端记录 `file_id`，下载时按序合并。当前最大约 **1GB（50×20MB）**。

</details>

<details>
<summary>3. 为什么要同时用 D1 和 KV？</summary>

- **D1**：结构化元数据、查询、**short_id**，列表体验好  
- **KV**：与 Workers 紧耦合的 key–value、大 value、TTL、分享数据，与现有分片/配置逻辑配合  

Telegram 仍存实际文件，两者分工不同。

</details>

<details>
<summary>4. 升级前已有大量文件在 KV，列表为空或不全？</summary>

绑定 D1 后，可调用 `POST /file/index/backfill` 等维护接口从 KV **回填**索引（需登录），或随业务逐步写入时自动 upsert。

</details>

<details>
<summary>5. Cloudflare Workers 免费版是否够用？</summary>

个人使用通常足够；大文件并发上传会占用更多 CPU/内存，**不建议同时并发多个大文件上传**。若使用 D1，还需留意 D1 的读写与存储配额。  
> [Workers 限制](https://developers.cloudflare.com/workers/platform/limits/) · [D1 说明](https://developers.cloudflare.com/d1/platform/limits/)

</details>

<details>
<summary>6. 如何获取 Telegram Bot Token 和 Chat ID？</summary>

**Bot Token**：Telegram 搜索 `@BotFather`，`/newbot`，保存返回的 Token。  

**Chat ID**：使用 `@userinfobot`，或请求 `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`。
</details>

---

## 📂 项目结构

```
OtterHub/
├── frontend/           # Next.js 前端
│   ├── lib/
│   │   ├── api/        # Hono RPC Client（类型安全）
│   │   │   ├── client.ts
│   │   │   └── ...
│   └── ...
├── functions/          # Cloudflare Pages Functions（Hono 后端）
│   ├── routes/         # 业务路由
│   │   ├── file/       # 列表、元数据、raw、回收站
│   │   ├── share/      # 分享（单文件 / 打包 / ZIP）
│   │   ├── upload/     # 上传
│   │   ├── short-file.ts # 根路径短链重定向
│   │   ├── wallpaper/  # 壁纸
│   │   └── ...
│   ├── middleware/
│   ├── utils/
│   │   ├── file-index.ts  # D1 索引、列表、short_id
│   │   ├── db-adapter/   # 存储（Telegram / R2）
│   │   ├── proxy/
│   │   └── ...
│   ├── app.ts
│   └── [[path]].ts
├── migrations/         # D1 SQL（如 0001_file_index.sql）
├── shared/             # 前后端共享类型
├── test/
├── public/
├── package.json
├── wrangler.jsonc
└── README.md
```

---

## 🔍 参考资料

- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegraph-Image](https://github.com/cf-pages/Telegraph-Image)
- [CloudFlare-ImgBed](https://github.com/MarSeventh/CloudFlare-ImgBed)

---

## 📋 功能清单（与实现状态）

- **账户与核心**：密码登录、分片大文件、HTTP Range、Private、回收站  
- **存储**：生产 Telegram、本地 R2；**D1 元数据 + KV 分片/配置**  
- **文件管理**：分页、批量复制/删除/重命名、收藏、标签、日期筛选、多维度排序、搜索  
- **分享**：`share:` + 令牌；单文件与多文件打包；ZIP 整包；可选过期  
- **短链**：D1 `short_id`，根路径与 `/file/...` 解析  
- **展示**：图片网格、视频缩略图（受 Telegram 与大小限制）、文本预览、图片加载策略、日夜模式、移动端、FAB、NSFW 遮罩、AI 图描述  
- **其他**：随机壁纸、可选 `API_TOKEN`、维护接口（索引回填、补全短链）

### 低优先级 / 未来

- [ ] 自建 Telegram Bot API（更高单文件下载上限等）

---

## 🤝 Contributing

欢迎提交 **Issue** 或 **Pull Request**；觉得有用可以点个 ⭐️。

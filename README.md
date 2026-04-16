# AI Creator

一站式 AI 创作平台，集成图像生成、视频创作、智能对话等功能，支持多种顶级 AI 模型。

## 功能模块

| 模块 | 路由 | 说明 |
|------|------|------|
| 首页 | `/home` | Dashboard 入口，快速跳转各功能 |
| AI 对话 | `/chat` | 多模型对话，支持视觉理解 |
| AI 图像 | `/image` | 文生图，支持 10+ 模型 |
| AI 视频 | `/video` | 文生视频，Kling V2 / Veo 3 |
| 创作室 | `/studio` | 个人创作项目管理 |
| 社区 | `/community` | 作品展示与发现 |
| 积分 | `/credits` | 充值与消耗记录 |
| 历史 | `/history` | 生成历史记录 |

## 技术架构

```
Next.js 16 (App Router)
├── React 19
├── Tailwind CSS v4
├── shadcn/ui 组件库
├── Supabase（Auth + PostgreSQL + Storage）
├── fal.ai（Flux 图像模型）
├── Google GenAI（Gemini / Imagen 模型）
├── Upstash Redis（限流）
└── 迅虎支付（积分充值）
```

### 目录结构

```
src/
├── app/
│   ├── (auth)/           # 登录 / 注册页
│   ├── (dashboard)/      # 登录后的主应用（含鉴权）
│   │   ├── home/         # 仪表盘首页
│   │   ├── chat/         # AI 对话
│   │   ├── image/        # AI 图像生成
│   │   ├── video/        # AI 视频生成
│   │   ├── studio/       # 创作室
│   │   ├── community/    # 社区
│   │   ├── credits/      # 积分
│   │   └── history/      # 历史记录
│   ├── (marketing)/      # 公开营销首页（未登录）
│   └── api/
│       ├── ai/
│       │   ├── chat/           # 流式对话 API
│       │   ├── image/generate/ # 图像生成（同步/异步）
│       │   └── video/generate/ # 视频生成
│       ├── credits/            # 余额查询 / 历史
│       ├── models/             # 可用模型列表
│       ├── orders/             # 支付下单 / 回调
│       └── tasks/              # 任务状态查询
├── components/
│   ├── dashboard/        # SidebarNav / BottomNav / UserMenu
│   ├── chat/             # ChatWindow
│   ├── credits/          # BalanceBadge
│   └── ui/               # shadcn/ui 基础组件
└── lib/
    ├── ai/
    │   ├── fal.ts              # fal.ai Flux 模型封装
    │   └── gemini-image.ts     # Gemini 图像生成封装
    ├── supabase/               # server / client 实例
    ├── pricing.ts              # 积分消耗定价表
    ├── ratelimit.ts            # Upstash 限流配置
    └── config.ts               # 全局配置
```

## AI 模型与积分消耗

### 图像生成

| 模型 | 积分/次 | 说明 |
|------|---------|------|
| Flux Schnell | 3 | 极速生成，fal.ai |
| Flux Dev | 8 | 高质量，fal.ai |
| Flux Pro | 10 | 专业级，fal.ai |
| Imagen 4 Fast | 6 | 谷歌快速版 |
| Imagen 4 | 10 | 谷歌标准版 |
| Imagen 4 Ultra | 15 | 谷歌旗舰版 |
| Gemini Flash Image | 6 | Gemini 图像生成 |
| Gemini Pro Image | 12 | Gemini 高质量 |

### 视频生成

| 模型 | 积分/次 | 时长 |
|------|---------|------|
| Kling V2 | 50 | 5 秒 |
| Kling V2 | 90 | 10 秒 |
| Veo 3 Fast | 50 | - |
| Veo 3 | 80 | - |

### AI 对话（每条消息）

| 模型 | 积分/条 |
|------|---------|
| GPT-4o | 1 |
| DeepSeek Chat | 1 |
| Claude Sonnet | 2 |
| Gemini 2.5 Pro | 3 |
| Gemini Flash 系列 | 1 |

## 本地开发

### 前置条件

- Node.js 20+
- npm
- Supabase 项目（含 auth、tasks 表、ai-creations bucket）

### 安装依赖

```bash
npm install
```

### 配置环境变量

```bash
cp .env.example .env.local
```

填写 `.env.local`：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI APIs
FAL_KEY=your-fal-key                        # fal.ai（Flux 图像）
KLING_API_KEY=your-kling-key                # 可灵视频
OPENAI_API_KEY=your-openai-key              # GPT-4o
DEEPSEEK_API_KEY=your-deepseek-key          # DeepSeek
ANTHROPIC_API_KEY=your-anthropic-key        # Claude
GOOGLE_GENERATIVE_AI_API_KEY=your-key       # Gemini / Imagen

# 支付（迅虎）
XUNHU_APPID=your-appid
XUNHU_KEY=your-key

# 限流（Upstash Redis）
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# 应用地址
NEXT_PUBLIC_URL=http://localhost:3000
```

### 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 生产部署

### 服务器要求

- Linux（Ubuntu 20.04+）
- Node.js 20+
- pm2（进程守护）
- nginx（可选，反向代理）

### 部署步骤

**1. 安装 pm2（首次）**

```bash
npm install -g pm2
```

**2. 上传代码**

```bash
# 将本地文件同步到服务器（无 git 方式）
scp -r src public package*.json next.config.* tsconfig.json root@your-server:/app/ai-creator/
```

**3. 安装依赖 & 构建**

```bash
ssh root@your-server
cd /app/ai-creator
npm install
npm run build
```

**4. 配置环境变量**

在服务器上创建 `/app/ai-creator/.env.local`，填入生产环境变量。

**5. 启动 / 重启服务**

```bash
# 首次启动
pm2 start npm --name ai-creator -- start

# 后续每次部署后重启
pm2 restart ai-creator
```

**6. 设置开机自启**

```bash
pm2 save
pm2 startup
```

### nginx 反向代理（推荐）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 增量部署（只更新部分文件）

日常迭代只需上传变更文件后重新构建：

```bash
# 本地执行
scp src/app/(dashboard)/image/page.tsx root@server:/app/ai-creator/src/app/(dashboard)/image/

# 服务器执行
ssh root@server "cd /app/ai-creator && npm run build && pm2 restart ai-creator"
```

## Supabase 数据库结构

### `tasks` 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| user_id | uuid | 关联 auth.users |
| type | text | `image` / `video` |
| model | text | 使用的模型 ID |
| prompt | text | 生成提示词 |
| status | text | `pending` / `processing` / `completed` / `failed` |
| output_url | text | 生成结果 URL |
| credits_cost | int | 消耗积分数 |
| upstream_id | text | 上游任务 ID（fal.ai request_id 等） |
| created_at | timestamptz | 创建时间 |

### 存储桶

- `ai-creations`：存储 Gemini 图像生成结果（公开读取）

### RPC 函数

- `deduct_credits(p_user_id, p_amount, p_task_id, p_desc)` — 原子扣除积分
- `refund_credits(p_user_id, p_amount, p_task_id)` — 生成失败时退款

## 积分套餐

| 套餐 | 价格 | 积分 |
|------|------|------|
| 体验包 | ¥9 | 100 |
| 基础包 | ¥29 | 400 |
| 标准包 ⭐ | ¥99 | 1500 |
| 专业包 | ¥299 | 5000 |

注册赠送 100 积分，永久有效，无月费。

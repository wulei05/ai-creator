# AI Creator 迁移计划：38.47.113.78 → 121.41.229.234

**日期：** 2026-04-25  
**目标：** 将 ai-creator 服务从旧服务器完整迁移到阿里云新服务器，业务不中断（迁移完成后再切流量）

---

## 服务器对比

| 项目 | 旧服务器 | 新服务器 |
|------|---------|---------|
| IP | 38.47.113.78 | 121.41.229.234 |
| 系统 | Ubuntu 24.04 | Alibaba Cloud Linux 3 |
| Node | v20.20.2 | ❌ 未安装 |
| PM2 | ✅ | ❌ 未安装 |
| nginx | nginx/1.24.0 | ❌ 未安装 |
| 应用目录 | /app/ai-creator | /app/ai-creator（同） |
| 端口 | 3000（Next.js）→ 80（nginx） | 同 |

---

## 迁移范围

- ✅ ai-creator Next.js 应用
- ✅ .env.local（更新 NEXT_PUBLIC_URL）
- ✅ nginx 配置
- ✅ crontab（poll-videos）
- ❌ new-api（不迁移，旧服务器保留）

---

## 迁移步骤

### Step 1：新服务器安装 Node.js 20

```bash
sshpass -p 'n/~K_z!rmTg,G@8' ssh -o StrictHostKeyChecking=no root@121.41.229.234 \
  'curl -fsSL https://rpm.nodesource.com/setup_20.x | bash - && yum install -y nodejs && node --version && npm --version'
```

Expected: `v20.x.x` 和 `10.x.x`

---

### Step 2：安装 PM2

```bash
sshpass -p 'n/~K_z!rmTg,G@8' ssh -o StrictHostKeyChecking=no root@121.41.229.234 \
  'npm install -g pm2 && pm2 --version'
```

Expected: 输出 PM2 版本号

---

### Step 3：安装 nginx

```bash
sshpass -p 'n/~K_z!rmTg,G@8' ssh -o StrictHostKeyChecking=no root@121.41.229.234 \
  'yum install -y nginx && nginx -v && systemctl enable nginx'
```

Expected: `nginx version: nginx/x.x.x`

---

### Step 4：创建应用目录

```bash
sshpass -p 'n/~K_z!rmTg,G@8' ssh -o StrictHostKeyChecking=no root@121.41.229.234 \
  'mkdir -p /app/ai-creator'
```

---

### Step 5：同步代码（本地 → 新服务器）

```bash
rsync -avz \
  --exclude='.env*' --exclude='node_modules' --exclude='.next' \
  --exclude='.git' --exclude='*.log' \
  -e "sshpass -p 'n/~K_z!rmTg,G@8' ssh -o StrictHostKeyChecking=no" \
  . root@121.41.229.234:/app/ai-creator/
```

---

### Step 6：复制 .env.local（旧服务器 → 新服务器）

```bash
# 从旧服务器读取 .env.local，写入新服务器，并更新 NEXT_PUBLIC_URL
sshpass -p 'BP5wqKoczwxJTWC3' ssh -o StrictHostKeyChecking=no root@38.47.113.78 \
  'cat /app/ai-creator/.env.local' | \
  sed 's|NEXT_PUBLIC_URL=.*|NEXT_PUBLIC_URL=http://121.41.229.234|' | \
  sshpass -p 'n/~K_z!rmTg,G@8' ssh -o StrictHostKeyChecking=no root@121.41.229.234 \
  'cat > /app/ai-creator/.env.local'
```

验证：

```bash
sshpass -p 'n/~K_z!rmTg,G@8' ssh -o StrictHostKeyChecking=no root@121.41.229.234 \
  'grep NEXT_PUBLIC_URL /app/ai-creator/.env.local'
```

Expected: `NEXT_PUBLIC_URL=http://121.41.229.234`

---

### Step 7：安装依赖 + 构建

```bash
sshpass -p 'n/~K_z!rmTg,G@8' ssh -o StrictHostKeyChecking=no root@121.41.229.234 \
  'cd /app/ai-creator && npm install 2>&1 | tail -3 && npm run build 2>&1 | tail -20'
```

Expected: 路由表输出，无 TypeScript 错误

---

### Step 8：PM2 启动应用

```bash
sshpass -p 'n/~K_z!rmTg,G@8' ssh -o StrictHostKeyChecking=no root@121.41.229.234 \
  'cd /app/ai-creator && pm2 start npm --name ai-creator -- start -- -p 3000 && pm2 save && pm2 startup | tail -1'
```

验证：

```bash
sshpass -p 'n/~K_z!rmTg,G@8' ssh -o StrictHostKeyChecking=no root@121.41.229.234 \
  'sleep 3 && pm2 list'
```

Expected: `ai-creator` status = `online`

---

### Step 9：配置 nginx

```bash
sshpass -p 'n/~K_z!rmTg,G@8' ssh -o StrictHostKeyChecking=no root@121.41.229.234 'cat > /etc/nginx/conf.d/ai-creator.conf << '"'"'EOF'"'"'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    client_max_body_size 20m;

    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;

    location / {
        proxy_pass http://127.0.0.1:3000;
    }
}
EOF'
```

启动 nginx：

```bash
sshpass -p 'n/~K_z!rmTg,G@8' ssh -o StrictHostKeyChecking=no root@121.41.229.234 \
  'nginx -t && systemctl start nginx && systemctl status nginx | grep Active'
```

Expected: `Active: active (running)`

---

### Step 10：配置 crontab（poll-videos）

```bash
sshpass -p 'n/~K_z!rmTg,G@8' ssh -o StrictHostKeyChecking=no root@121.41.229.234 \
  '(crontab -l 2>/dev/null; echo "*/2 * * * * curl -s -H \"Authorization: Bearer f09e14b19d7a786e3a9a7b90caba755e\" http://localhost:3000/api/cron/poll-videos >> /var/log/poll-videos.log 2>&1") | crontab - && crontab -l'
```

---

### Step 11：Smoke Test

```bash
# 测试 HTTP 访问
curl -s -o /dev/null -w "%{http_code}" http://121.41.229.234/

# 测试 cron API
sshpass -p 'n/~K_z!rmTg,G@8' ssh -o StrictHostKeyChecking=no root@121.41.229.234 \
  'curl -s -H "Authorization: Bearer f09e14b19d7a786e3a9a7b90caba755e" http://localhost:3000/api/cron/poll-videos'
```

Expected: HTTP 200；cron 返回 `{"processed":...}`

---

### Step 12：更新 Supabase Redirect URL

迁移完成后，在 Supabase Dashboard → Authentication → URL Configuration：

- **Site URL** → `http://121.41.229.234`
- **Redirect URLs** → 添加 `http://121.41.229.234/**`

---

## 完成后的旧服务器处理

迁移验证无误后，旧服务器 `38.47.113.78` 上的 ai-creator 可以停止（`pm2 stop ai-creator`），保留 `new-api` 继续运行。旧服务器暂不销毁，留作回滚备用。

---

## 回滚方案

若新服务器出现问题，只需将 DNS/访问入口切回 `38.47.113.78`，旧服务器未做任何改动，随时可恢复。

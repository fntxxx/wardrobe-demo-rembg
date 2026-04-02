# wardrobe-demo-rembg

這個專案是以 Next.js pages router 建立的 demo，前端瀏覽器只會呼叫本專案自己的 `/api/*` API route，再由 server side API route 代理呼叫上游 FastAPI 服務。

## Getting Started

1. 安裝依賴：

```bash
npm install
```

2. 在專案根目錄建立 `.env.local`，並設定必要環境變數：

```bash
REMBG_API_BASE_URL=https://your-rembg-service.example.com
REMBG_API_TOKEN=<your-rembg-api-token>
FASHION_ATTR_API_URL=https://your-fashion-attr-service.example.com/predict
FASHION_ATTR_API_TOKEN=<your-fashion-attr-api-token>

# 若你要保留 demo 自身 /api/remove-bg 的 x-api-key 保護，再額外設定
INTERNAL_API_KEY=<optional-demo-route-key>
NEXT_PUBLIC_INTERNAL_API_KEY=<optional-demo-route-key>
```

- `REMBG_API_TOKEN` 與 `FASHION_ATTR_API_TOKEN` 只會在 Next.js server side API route 使用，不可改成 `NEXT_PUBLIC_`。
- `INTERNAL_API_KEY` / `NEXT_PUBLIC_INTERNAL_API_KEY` 是現有 demo 自身 `/api/remove-bg` 路由保護機制，與上游 FastAPI 的 Bearer Token 是不同層級的設定。

3. 啟動開發伺服器：

```bash
npm run dev
```

打開 [http://localhost:3000](http://localhost:3000) 查看結果。

## API Proxy Flow

- Browser → `POST /api/remove-bg` → `rembg-service`
- Browser → `POST /api/attributes` → `fashion-attr-service`

上游 Bearer Token 只存在於 `pages/api/remove-bg.ts` 與 `pages/api/attributes.ts` 的 server side `fetch`。

## Deploy on Vercel

請在 Vercel Project Settings → Environment Variables 設定以下敏感環境變數：

- `REMBG_API_BASE_URL`
- `REMBG_API_TOKEN`
- `FASHION_ATTR_API_URL`
- `FASHION_ATTR_API_TOKEN`

若有啟用 demo 自身 `/api/remove-bg` 的 `x-api-key` 保護，再另外設定：

- `INTERNAL_API_KEY`
- `NEXT_PUBLIC_INTERNAL_API_KEY`

不要把真實 token 寫入版本控制或文件中。

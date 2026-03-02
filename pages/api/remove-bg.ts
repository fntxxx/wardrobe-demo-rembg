import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { File } from "formidable";
import fs from "node:fs";

import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

export const config = {
    api: { bodyParser: false },
    regions: ["hkg1"],
};

// ---- Config ----
const REMBG_BASE =
    process.env.REMBG_API_BASE_URL?.replace(/\/+$/, "") ||
    "https://fntxxx-rembg-service.hf.space";

// 固定縮圖上限，避免有人丟超大圖把你打爆
const DEFAULT_MAX_SIDE = 768;

// Vercel 上拿真實 IP（若前面有 Proxy/CDN）
function getClientIp(req: NextApiRequest) {
    const xf = req.headers["x-forwarded-for"];
    const ip = Array.isArray(xf) ? xf[0] : xf?.split(",")[0]?.trim();
    return ip || req.socket.remoteAddress || "unknown";
}

// ---- Rate limit (Upstash) ----
const redis = Redis.fromEnv();
const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "60 s"), // 每 IP 每分鐘 10 次
    analytics: true,
    prefix: "rl:remove-bg",
});

function parseForm(req: NextApiRequest): Promise<{ file: File }> {
    const form = formidable({
        multiples: false,
        maxFileSize: 8 * 1024 * 1024, // 8MB 上限（可調）
        filter: ({ mimetype, originalFilename }) => {
            // 白名單：jpg/png/webp
            const okMime =
                mimetype === "image/jpeg" ||
                mimetype === "image/png" ||
                mimetype === "image/webp";
            const okExt = /\.(jpg|jpeg|png|webp)$/i.test(originalFilename || "");
            return okMime || okExt;
        },
    });

    return new Promise((resolve, reject) => {
        form.parse(req, (err: any, _fields: any, files: any) => {
            if (err) return reject(err);
            const f = files.file;
            if (!f) return reject(new Error("缺少 file 欄位"));
            const file = Array.isArray(f) ? f[0] : f;
            resolve({ file });
        });
    });
}

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(url: string, init: RequestInit) {
    // HF / 上游偶爾短暫 502/503，做保守重試
    const delays = [0, 800, 1600];
    let lastStatus: number | null = null;
    let lastBody = "";

    for (let i = 0; i < delays.length; i++) {
        if (delays[i] > 0) await sleep(delays[i]);

        const ac = new AbortController();
        const timeout = setTimeout(() => ac.abort(), 25_000); // 25 秒 timeout
        try {
            const r = await fetch(url, { ...init, signal: ac.signal });
            clearTimeout(timeout);

            if (r.ok) return r;

            lastStatus = r.status;
            lastBody = await r.text().catch(() => "");

            if ((r.status === 502 || r.status === 503) && i < delays.length - 1) {
                continue;
            }
            return r;
        } catch (e: any) {
            clearTimeout(timeout);
            lastBody = String(e?.message ?? e);
            if (i < delays.length - 1) continue;
            throw e;
        }
    }

    throw new Error(`upstream failed (status=${lastStatus}): ${lastBody}`);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).end();
    }

    // （可選）簡單 API Key：避免被別人隨手拿 endpoint 狂打
    const requiredKey = process.env.INTERNAL_API_KEY;
    if (requiredKey) {
        const got = req.headers["x-api-key"];
        if (got !== requiredKey) {
            return res.status(401).json({ error: "unauthorized" });
        }
    }

    // Rate limit
    const ip = getClientIp(req);
    const rl = await ratelimit.limit(ip);
    res.setHeader("X-RateLimit-Limit", String(rl.limit));
    res.setHeader("X-RateLimit-Remaining", String(rl.remaining));
    if (!rl.success) {
        return res.status(429).json({ error: "too many requests" });
    }

    try {
        const { file } = await parseForm(req);
        const buf = await fs.promises.readFile(file.filepath);

        if (!buf || buf.length === 0) {
            return res.status(400).json({ error: "empty file" });
        }

        const formData = new FormData();
        const mime = (file as any).mimetype || "image/jpeg";
        formData.append(
            "file",
            new Blob([buf], { type: mime }),
            file.originalFilename ?? "upload.jpg"
        );

        const url = `${REMBG_BASE}/remove-bg?max_side=768&quality=fast`;
        const r = await fetchWithRetry(url, { method: "POST", body: formData });

        if (!r.ok) {
            const text = await r.text().catch(() => "");
            return res.status(502).json({
                error: "rembg upstream failed",
                status: r.status,
                detail: text,
            });
        }

        const out = Buffer.from(await r.arrayBuffer());
        res.setHeader("Content-Type", "image/png");
        // 基本的 cache policy（可改成 no-store 也行）
        res.setHeader("Cache-Control", "no-store");
        return res.status(200).send(out);
    } catch (err: any) {
        return res.status(400).json({ error: err?.message ?? "bad request" });
    }
}
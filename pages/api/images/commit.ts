// pages/api/images/commit.ts
import type { NextApiRequest, NextApiResponse } from "next";

type ImageRecord = {
    id: string;
    public_id: string;
    secure_url?: string;
    bytes: number;
    width: number;
    height: number;
    format: string;
    createdAt: string;
};

type Data =
    | { ok: true; record: ImageRecord }
    | { ok: false; error: string };

declare global {
    // eslint-disable-next-line no-var
    var __demo_images_store__: ImageRecord[] | undefined;
}

const store = global.__demo_images_store__ ?? (global.__demo_images_store__ = []);

function isNum(n: unknown): n is number {
    return typeof n === "number" && Number.isFinite(n);
}

export default function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
    if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

    try {
        const { public_id, secure_url, bytes, width, height, format } = req.body ?? {};

        if (typeof public_id !== "string" || public_id.length < 3) {
            return res.status(400).json({ ok: false, error: "Invalid public_id" });
        }
        if (!isNum(bytes) || !isNum(width) || !isNum(height) || typeof format !== "string") {
            return res.status(400).json({ ok: false, error: "Invalid metadata" });
        }

        // demo 基本限制：避免 svg、過大檔案（你可自行調整）
        const allowFormats = new Set(["jpg", "jpeg", "png", "webp", "avif"]);
        if (!allowFormats.has(format.toLowerCase())) {
            return res.status(400).json({ ok: false, error: "Format not allowed" });
        }
        if (bytes > 15 * 1024 * 1024) {
            return res.status(400).json({ ok: false, error: "File too large (demo limit 15MB)" });
        }

        const record: ImageRecord = {
            id: crypto.randomUUID(),
            public_id,
            secure_url: typeof secure_url === "string" ? secure_url : undefined,
            bytes,
            width,
            height,
            format,
            createdAt: new Date().toISOString(),
        };

        store.unshift(record);
        return res.status(200).json({ ok: true, record });
    } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        return res.status(500).json({ ok: false, error: msg });
    }
}
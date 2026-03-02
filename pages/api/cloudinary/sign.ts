// pages/api/cloudinary/sign.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { v2 as cloudinary } from "cloudinary";

type Data =
    | { ok: true; cloudName: string; apiKey: string; timestamp: number; signature: string; folder: string; public_id: string }
    | { ok: false; error: string };

function mustEnv(name: string): string {
    const v = process.env[name];
    if (!v) throw new Error(`Missing env: ${name}`);
    return v;
}

export default function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
    if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

    try {
        const cloudName = mustEnv("CLOUDINARY_CLOUD_NAME");
        const apiKey = mustEnv("CLOUDINARY_API_KEY");
        const apiSecret = mustEnv("CLOUDINARY_API_SECRET");

        cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

        const timestamp = Math.floor(Date.now() / 1000);

        // 你可以改成 userId/garmentId 分層資料夾，demo 先固定即可
        const folder = "demo/wardrobe";

        // Node 18+ 可用 crypto.randomUUID()
        const public_id = `${folder}/${crypto.randomUUID()}`;

        // 只把需要的參數簽起來，避免前端亂改 folder/public_id
        const paramsToSign: Record<string, string | number> = {
            timestamp,
            folder,
            public_id,
        };

        const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

        return res.status(200).json({
            ok: true,
            cloudName,
            apiKey,
            timestamp,
            signature,
            folder,
            public_id,
        });
    } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        return res.status(500).json({ ok: false, error: msg });
    }
}
import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { File } from "formidable";
import fs from "fs";

export const config = {
    api: {
        bodyParser: false,
    },
};

function getFirstFile(file: File | File[] | undefined): File | null {
    if (!file) return null;
    return Array.isArray(file) ? file[0] : file;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const apiUrl = process.env.FASHION_ATTR_API_URL;
    if (!apiUrl) {
        return res.status(500).json({ error: "缺少 FASHION_ATTR_API_URL 環境變數" });
    }

    const form = formidable({ multiples: false });

    form.parse(req, async (err, _fields, files) => {
        if (err) {
            return res.status(500).json({ error: "表單解析失敗" });
        }

        const imageFile = getFirstFile(files.image as File | File[] | undefined);

        if (!imageFile) {
            return res.status(400).json({ error: "缺少 image 檔案" });
        }

        try {
            const fileBuffer = fs.readFileSync(imageFile.filepath);

            const formData = new FormData();
            const blob = new Blob([fileBuffer], {
                type: imageFile.mimetype || "application/octet-stream",
            });

            formData.append("image", blob, imageFile.originalFilename || "image.jpg");

            const response = await fetch(apiUrl, {
                method: "POST",
                body: formData,
            });

            const text = await response.text();

            if (!response.ok) {
                return res.status(response.status).json({
                    error: text || "屬性服務請求失敗",
                });
            }

            try {
                const json = JSON.parse(text);
                return res.status(200).json(json);
            } catch {
                return res.status(500).json({ error: "後端回傳非 JSON 格式" });
            }
        } catch (error) {
            return res.status(500).json({
                error: error instanceof Error ? error.message : "屬性辨識失敗",
            });
        }
    });
}
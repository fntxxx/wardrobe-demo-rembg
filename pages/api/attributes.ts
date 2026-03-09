import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { File as FormidableFile } from "formidable";
import fs from "fs";

export const config = {
    api: {
        bodyParser: false,
    },
};

function parseForm(req: NextApiRequest): Promise<{ file: FormidableFile | null }> {
    const form = formidable({
        multiples: false,
        keepExtensions: true,
    });

    return new Promise((resolve, reject) => {
        form.parse(req, (err, _fields, files) => {
            if (err) return reject(err);

            const value = files.file;
            const f = Array.isArray(value) ? value[0] : value;
            resolve({ file: (f as FormidableFile) ?? null });
        });
    });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
        const { file } = await parseForm(req);

        if (!file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const apiUrl = process.env.FASHION_ATTR_API_URL;
        if (!apiUrl) {
            return res.status(500).json({ error: "Missing FASHION_ATTR_API_URL" });
        }

        const fileBuffer = await fs.promises.readFile(file.filepath);

        const formData = new FormData();
        const blob = new Blob([fileBuffer], {
            type: file.mimetype || "application/octet-stream",
        });

        formData.append("file", blob, file.originalFilename || "upload.png");

        const response = await fetch(apiUrl, {
            method: "POST",
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        return res.status(200).json(data);
    } catch (e) {
        const message = e instanceof Error ? e.message : "unknown error";
        return res.status(500).json({ error: message });
    }
}
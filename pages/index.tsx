// pages/index.tsx
import { useEffect, useState } from "react";

export default function HomePage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [removedUrl, setRemovedUrl] = useState<string | null>(null);

  // 避免 ObjectURL 記憶體累積
  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
      if (removedUrl) URL.revokeObjectURL(removedUrl);
    };
  }, [originalUrl, removedUrl]);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (!picked) return;

    setBusy(true);
    setError(null);

    // 清掉舊結果 + 回收舊 URL
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (removedUrl) URL.revokeObjectURL(removedUrl);
    setOriginalUrl(null);
    setRemovedUrl(null);

    // 先顯示原圖
    const ori = URL.createObjectURL(picked);
    setOriginalUrl(ori);

    const formData = new FormData();
    formData.append("file", picked);

    try {
      // 你 API route 內部已經有預設 max_side=1024（或你可自行調整）
      const r = await fetch("/api/remove-bg", {
        method: "POST",
        body: formData,
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY ?? "",
        },
      });

      if (!r.ok) {
        const t = await r.text().catch(() => "");
        throw new Error(`去背失敗：${r.status}${t ? `\n${t}` : ""}`);
      }

      const blob = await r.blob();
      const out = URL.createObjectURL(blob);
      setRemovedUrl(out);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "去背失敗";
      setError(msg);
    } finally {
      setBusy(false);
      // 讓「選同一張檔」也能再次觸發 onChange
      e.target.value = "";
    }
  }

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: "40px auto",
        padding: 16,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>
        Wardrobe Demo（原圖 / 去背圖對照）
      </h1>
      <div style={{ color: "#555", marginBottom: 16, lineHeight: 1.6 }}>
        選一張圖片後會自動呼叫 <code>/api/remove-bg</code>，右側顯示去背結果。
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <input type="file" accept="image/*" onChange={onPickFile} disabled={busy} />
        {busy && <span style={{ color: "#555" }}>處理中…</span>}
      </div>

      {error && (
        <div
          style={{
            background: "#ffecec",
            border: "1px solid #ffb3b3",
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
            whiteSpace: "pre-wrap",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6 }}>錯誤</div>
          {error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
      >
        <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>原圖</div>
          {originalUrl ? (
            <img
              src={originalUrl}
              alt="original"
              style={{ width: "100%", borderRadius: 8 }}
            />
          ) : (
            <div
              style={{
                height: 260,
                borderRadius: 8,
                background: "#f6f6f6",
                display: "grid",
                placeItems: "center",
                color: "#777",
              }}
            >
              尚未選擇圖片
            </div>
          )}
        </section>

        <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>去背圖（PNG）</div>
          {removedUrl ? (
            <img
              src={removedUrl}
              alt="bg-removed"
              style={{ width: "100%", borderRadius: 8, background: "#f6f6f6" }}
            />
          ) : (
            <div
              style={{
                height: 260,
                borderRadius: 8,
                background: "#f6f6f6",
                display: "grid",
                placeItems: "center",
                color: "#777",
              }}
            >
              尚未產生去背結果
            </div>
          )}
        </section>
      </div>

      {/* 小螢幕時變單欄 */}
      <style jsx>{`
        @media (max-width: 860px) {
          div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}
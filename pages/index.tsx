import { SectionTitle } from "@/modules/wardrobe/components/SectionTitle";
import { UploadPanel } from "@/modules/wardrobe/components/UploadPanel";
import { EditPanel } from "@/modules/wardrobe/components/EditPanel";
import { PreviewPanel } from "@/modules/wardrobe/components/PreviewPanel";
import { useIsMobile } from "@/modules/wardrobe/hooks/useIsMobile";
import { useWardrobeDemo } from "@/modules/wardrobe/hooks/useWardrobeDemo";

export default function HomePage() {
  const isMobile = useIsMobile();
  const {
    stage,
    error,
    attrError,
    originalUrl,
    processedUrl,
    attributes,
    formState,
    setFormState,
    handleFileChange,
    categoryCandidates,
    occasionCandidates,
    seasonCandidates,
    colorCandidates,
    isBusy,
  } = useWardrobeDemo();

  const canEdit = Boolean(formState) && !isBusy;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F5F7FA",
        color: "#111827",
      }}
    >
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: isMobile ? 18 : 32 }}>
        <SectionTitle
          title="衣櫥建檔 Demo"
          subtitle="上傳服飾圖片後，系統會先做去背，再自動辨識類別、場合、季節與色系。你可以直接在右側檢查預覽圖，並在左側調整最終資料。"
        />

        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: 24,
            alignItems: "flex-start",
          }}
        >
          <div style={{ flex: 1, display: "grid", gap: 24 }}>
            <UploadPanel
              stage={stage}
              isBusy={isBusy}
              error={error}
              attrError={attrError}
              onChange={handleFileChange}
            />

            <EditPanel
              formState={formState}
              setFormState={setFormState}
              canEdit={canEdit}
              isMobile={isMobile}
            />
          </div>

          <PreviewPanel
            stage={stage}
            originalUrl={originalUrl}
            processedUrl={processedUrl}
            attributes={attributes}
            categoryCandidates={categoryCandidates}
            occasionCandidates={occasionCandidates}
            seasonCandidates={seasonCandidates}
            colorCandidates={colorCandidates}
            isMobile={isMobile}
          />
        </div>
      </div>
    </main>
  );
}
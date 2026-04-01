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
        background: "#F7F7F6",
        color: "#111827",
        padding: isMobile ? "24px 16px 40px" : "36px 28px 56px",
        fontFamily:
          "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
        }}
      >
        <SectionTitle
          title="Wardrobe Demo"
          subtitle="圖片上傳後會先做去背，再使用處理後圖片進行服飾屬性辨識。"
        />

        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: 24,
            alignItems: "start",
          }}
        >
          <section
            style={{
              flex: 1,
              minWidth: 0,
              background: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: 24,
              padding: 18,
            }}
          >
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
          </section>

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

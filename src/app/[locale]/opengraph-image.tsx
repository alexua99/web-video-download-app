import { ImageResponse } from "next/og";
import { isLocale, seo } from "@/lib/seo";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const copy = isLocale(locale) ? seo[locale] : seo.en;
  const brand = locale === "uk" ? "Кліп" : "Clip";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "linear-gradient(180deg, #120814 0%, #07060c 100%)",
          color: "white",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #fb7185, #e11d48 50%, #7c3aed)",
              fontSize: 32,
            }}
          >
            ▶
          </div>
          <div style={{ fontSize: 40, fontWeight: 700 }}>{brand}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 58,
              fontWeight: 700,
              lineHeight: 1.15,
              maxWidth: 980,
            }}
          >
            {copy.ogTitle}
          </div>
          <div style={{ fontSize: 28, opacity: 0.72 }}>
            YouTube · TikTok · Instagram · MP4 · MP3
          </div>
        </div>
      </div>
    ),
    size,
  );
}

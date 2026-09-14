import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #fb7185, #e11d48 50%, #7c3aed)",
          color: "white",
          fontSize: 82,
          borderRadius: 40,
        }}
      >
        ▶
      </div>
    ),
    size,
  );
}

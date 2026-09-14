import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Clip — Download YouTube, TikTok and Instagram videos",
    short_name: "Clip",
    description:
      "Download videos from YouTube, TikTok, and Instagram as MP4 or MP3.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#07060c",
    theme_color: "#e11d48",
    lang: "uk",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    id: getSiteUrl(),
  };
}

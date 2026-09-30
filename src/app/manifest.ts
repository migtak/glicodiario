import type { MetadataRoute } from "next";

/** Manifesto do PWA: permite instalar o app na tela inicial. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GlicoDiário",
    short_name: "GlicoDiário",
    description: "Acompanhe sua glicemia no dia a dia.",
    lang: "pt-BR",
    start_url: "/inicio",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#0e6e73",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

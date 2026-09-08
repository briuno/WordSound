import type { MetadataRoute } from "next";

/**
 * Manifesto do PWA. Servido em /manifest.webmanifest.
 *
 * start_url e /app porque o app instalado abre direto na trilha; quem nao tem
 * sessao cai no /login pelo proxy. O id fixo evita que o navegador trate
 * uma mudanca de start_url como outro app.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/app",
    name: "WordSound",
    short_name: "WordSound",
    description: "Learn. Listen. Go further. Estude ingles com leitura, audio e pratica guiada.",
    lang: "pt-BR",
    dir: "ltr",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#f7f9ff",
    theme_color: "#4f7cff",
    categories: ["education", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Revisao de hoje",
        short_name: "Revisao",
        description: "Abre a fila de revisao espacada",
        url: "/app/review",
      },
      {
        name: "Meu progresso",
        short_name: "Progresso",
        description: "XP, sequencia e conquistas",
        url: "/app/progress",
      },
    ],
  };
}

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Navegacao, prefetch e Server Action param de estourar erro quando a rede
    // cai: o Next segura a requisicao e refaz sozinho quando a conexao volta.
    // Tambem e o que habilita o hook useOffline (components/offline-banner).
    useOffline: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        // o worker precisa ser sempre revalidado, senao o usuario fica preso
        // numa versao antiga do cache
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;

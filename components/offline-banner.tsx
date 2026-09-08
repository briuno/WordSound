"use client";

import { CloudOff } from "lucide-react";
import { useOffline } from "next/offline";

/**
 * Faixa de conexao. Fica dentro do header fixo de cada area, entao continua
 * visivel com a pagina rolada.
 *
 * O useOffline do Next e mais confiavel que navigator.onLine: ele tambem marca
 * offline quando uma navegacao ou Server Action falha, e o proprio framework
 * repete a requisicao quando a rede volta.
 */
export function OfflineBanner() {
  const isOffline = useOffline();
  if (!isOffline) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 bg-navy px-4 py-1.5 text-center text-xs font-semibold text-white"
    >
      <CloudOff size={14} aria-hidden className="shrink-0" />
      Sem conexao. O que voce fizer agora vai ser enviado quando a internet voltar.
    </div>
  );
}

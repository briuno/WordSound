"use client";

import { RotateCcw } from "lucide-react";
import { useOffline } from "next/offline";

import { Button } from "@/components/ui";

/**
 * Botao da pagina offline.
 *
 * O service worker manda a pagina que falhou no `?from=`, entao tentar de novo
 * leva o aluno de volta para onde ele estava, e nao para a home. So aceita
 * caminho interno: `?from=` vem da URL e ninguem impede de edita-la na mao.
 */
function retryTarget(): string {
  const from = new URLSearchParams(window.location.search).get("from");
  if (!from || !from.startsWith("/") || from.startsWith("//")) return "/app";
  return from;
}

export function OfflineRetry() {
  const isOffline = useOffline();

  return (
    <div className="mt-6 flex flex-col items-center gap-2">
      <Button
        onClick={() => {
          window.location.href = retryTarget();
        }}
      >
        <RotateCcw size={16} aria-hidden />
        Tentar de novo
      </Button>
      {/* sem afirmar que a rede voltou: o navegador pode estar online e o
          servidor fora do ar, e quem sabe a verdade e a proxima tentativa */}
      <p className="text-xs text-text-muted">
        {isOffline ? "Ainda sem conexao." : "Se a rede ja voltou, isso te leva de volta."}
      </p>
    </div>
  );
}

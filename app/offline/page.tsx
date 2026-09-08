import type { Metadata } from "next";

import { Logo } from "@/components/brand";
import { OfflineAudioList } from "@/components/offline-audio-list";
import { OfflineRetry } from "@/components/offline-retry";
import { Card } from "@/components/ui";

export const metadata: Metadata = { title: "Sem conexao" };

/**
 * Pagina que o service worker entrega quando uma navegacao nao alcanca a rede.
 * Precisa ser estatica e publica: e o unico HTML que existe no cache.
 */
export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-12">
      <Logo withTagline className="mb-8 self-center" />
      <Card className="text-center">
        <h1 className="text-xl font-extrabold tracking-tight">Voce esta sem conexao</h1>
        <p className="mt-2 text-sm text-text-muted">
          As licoes precisam de internet para carregar. Assim que a rede voltar, e so recarregar que
          voce continua de onde parou.
        </p>
        <OfflineRetry />
      </Card>

      {/* o que o aluno baixou continua tocando: vem do cache, nao da rede */}
      <section aria-labelledby="audios-offline" className="mt-8">
        <h2
          id="audios-offline"
          className="mb-3 text-sm font-bold uppercase tracking-wide text-text-muted"
        >
          Seus audios baixados
        </h2>
        <OfflineAudioList emptyHint="Voce ainda nao baixou nenhum audio. Dentro de uma licao com audio, use 'Baixar o audio' para ouvir mesmo sem internet." />
      </section>
    </main>
  );
}

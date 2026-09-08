"use client";

import * as React from "react";

import { claimOfflineAudio } from "@/lib/offline-audio";

/**
 * Amarra os audios baixados a quem esta logado.
 *
 * Aparelho compartilhado e comum: se outra conta entra, o download da anterior
 * e apagado em vez de continuar acessivel pela pagina offline, que nao tem como
 * checar sessao.
 */
export function OfflineAudioGuard({ userId }: { userId: string }) {
  React.useEffect(() => {
    void claimOfflineAudio(userId);
  }, [userId]);

  return null;
}

import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/** Antigo middleware.ts: a convencao virou proxy.ts a partir do Next 16. */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // tudo, menos estaticos, imagens e os arquivos do PWA (o service worker e o
    // manifesto sao publicos e nao podem depender de sessao)
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.webmanifest|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|m4a|wav)$).*)",
  ],
};

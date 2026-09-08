"use client";

import { RefreshCw } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui";

/**
 * Registra o service worker e avisa quando ha versao nova esperando.
 *
 * So roda em producao: em dev o cache do worker serviria chunks velhos e
 * quebraria o hot reload. Para testar o PWA localmente use `npm run build`
 * seguido de `npm start`.
 */
export function ServiceWorkerManager() {
  const [waiting, setWaiting] = React.useState<ServiceWorker | null>(null);

  React.useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    let disposed = false;
    // controlador que ja existia na montagem: sem ele, o controllerchange e
    // apenas a primeira instalacao e nao deve recarregar a pagina do usuario
    const hadController = navigator.serviceWorker.controller !== null;
    let reloading = false;

    function trackInstall(registration: ServiceWorkerRegistration) {
      const installing = registration.installing;
      if (!installing) return;
      installing.addEventListener("statechange", () => {
        if (installing.state === "installed" && navigator.serviceWorker.controller) {
          if (!disposed) setWaiting(installing);
        }
      });
    }

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((registration) => {
        if (disposed) return;
        if (registration.waiting && navigator.serviceWorker.controller) {
          setWaiting(registration.waiting);
        }
        registration.addEventListener("updatefound", () => trackInstall(registration));

        // o sw.js nao muda entre deploys, entao ele nao reinstala sozinho e a
        // casca offline guardada ficaria apontando para chunks do build antigo
        navigator.serviceWorker.controller?.postMessage("REFRESH_SHELL");
      })
      .catch(() => {
        // sem service worker o app continua funcionando online; nao ha o que fazer
      });

    function onControllerChange() {
      if (!hadController || reloading) return;
      reloading = true;
      window.location.reload();
    }

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    return () => {
      disposed = true;
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  if (!waiting) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-md items-center gap-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-surface p-3 pl-4 shadow-[var(--shadow-lift)]"
      style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <RefreshCw size={18} className="shrink-0 text-brand" aria-hidden />
      <p className="flex-1 text-sm font-semibold">Nova versao disponivel</p>
      <Button
        size="sm"
        onClick={() => {
          waiting.postMessage("SKIP_WAITING");
          setWaiting(null);
        }}
      >
        Atualizar
      </Button>
    </div>
  );
}

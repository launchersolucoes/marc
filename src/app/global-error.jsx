"use client";

import { useEffect } from "react";
import SystemState from "../components/system-state";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("[Marc UI] Falha global", { digest: error?.digest || "sem-digest" });
  }, [error]);

  return (
    <html lang="pt-BR" data-theme="dark">
      <body>
        <SystemState
          eyebrow="O Marc precisa recarregar"
          title="A operação foi interrompida."
          description="Nada foi apagado. Recarregue o Marc para retomar do ponto seguro mais recente."
          actionLabel="Recarregar o Marc"
          onRetry={reset}
        />
      </body>
    </html>
  );
}

"use client";

import { useEffect } from "react";
import SystemState from "../components/system-state";

export default function ErrorPage({ error, reset }) {
  useEffect(() => {
    console.error("[Marc UI] Falha recuperável", { digest: error?.digest || "sem-digest" });
  }, [error]);

  return (
    <SystemState
      title="Não conseguimos abrir esta página."
      description="Sua sessão e seus dados continuam seguros. Tente carregar novamente; se a conexão estiver instável, aguarde alguns segundos."
      onRetry={reset}
    />
  );
}

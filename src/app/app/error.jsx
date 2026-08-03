"use client";

import { useEffect } from "react";
import SystemState from "../../components/system-state";

export default function AppError({ error, reset }) {
  useEffect(() => {
    console.error("[Marc App] Falha na área operacional", { digest: error?.digest || "sem-digest" });
  }, [error]);

  return (
    <SystemState
      eyebrow="Sua operação continua segura"
      title="Não foi possível atualizar o painel."
      description="Pode ser uma oscilação momentânea de conexão. Tente novamente antes de repetir qualquer cadastro ou agendamento."
      actionLabel="Tentar abrir novamente"
      onRetry={reset}
      backHref="/app"
      backLabel="Voltar ao painel"
      compact
    />
  );
}

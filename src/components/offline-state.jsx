"use client";

import SystemState from "./system-state";

export default function OfflineState() {
  return (
    <SystemState
      eyebrow="Sem conexão"
      title="O Marc está esperando a internet voltar."
      description="Por segurança, agendas e dados de clientes não ficam armazenados neste dispositivo. Reconecte-se e tente novamente."
      actionLabel="Tentar reconectar"
      onRetry={() => window.location.reload()}
      backHref="/app"
      backLabel="Voltar ao aplicativo"
    />
  );
}

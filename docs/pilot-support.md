# Suporte do piloto Marc

Este é o protocolo operacional inicial do piloto assistido.

## Canal

- Canal registrado: `launchersolucoes@gmail.com`.
- Responsáveis: Calebe Alves e Alan Pires.
- Janela de cobertura: das 8h às 22h (horário de Brasília), durante as rodadas combinadas do piloto.
- Para cada chamado, registrar estabelecimento, horário, papel do usuário, tela, ação e resultado observado.
- Não enviar senha, token, documento completo, dados financeiros sensíveis ou listas de clientes por e-mail.

## Prioridades propostas

- **P1 — operação bloqueada, perda de dados ou violação de permissão:** interromper a rodada; resposta inicial proposta em até 1 hora durante o período de suporte.
- **P2 — função relevante falha ou gera forte atrito:** resposta inicial proposta no mesmo dia útil e correção antes da próxima rodada.
- **P3 — melhoria visual ou de conveniência:** registrar no backlog e avaliar no fechamento semanal.

## Triagem

1. Confirmar `/api/health` e o deploy atual.
2. Preservar horário, papel e passos de reprodução, sem copiar dados pessoais desnecessários.
3. Reproduzir apenas no estabelecimento piloto.
4. Registrar o problema no painel Master.
5. Para P1, pausar a rodada e definir responsável pela comunicação.
6. Após correção, repetir o cenário e registrar a evidência de aceite.

## Contingência

- Calebe Alves e Alan Pires compartilham a triagem; o primeiro disponível assume o chamado e registra o responsável.
- O e-mail `launchersolucoes@gmail.com` permanece como registro oficial do incidente.
- Até existir um telefone ou grupo dedicado, a contingência P1 deve ser combinada previamente com cada participante da rodada.
- Durante um P1 aberto, atualizar os participantes a cada hora, mesmo quando ainda não houver resolução.

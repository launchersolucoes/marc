# Operação de produção — Marc

Este runbook define o mínimo para operar o piloto assistido sem depender de integrações futuras.

## Saúde e monitoramento

- Endpoint público: `GET /api/health`.
- Resposta `200 {"status":"ok"}`: aplicação alcança o serviço de autenticação do Supabase.
- Resposta `503 {"status":"degraded"}`: configuração ausente, timeout ou indisponibilidade do Supabase.
- O endpoint não devolve chaves, URLs internas, contagens ou dados de clientes.
- Configure na Vercel ou no serviço de uptime escolhido uma verificação a cada 5 minutos e alerte a Launcher após duas falhas consecutivas.
- Erros de renderização e requisição já geram eventos estruturados `marc_request_error` nos logs da Vercel, sem URL, headers, mensagem livre ou dados pessoais.

## Rotina de release

1. Execute `npm run build`.
2. Execute `npm run test:all` contra o ambiente local.
3. Faça o push para `main` e aguarde o deploy ficar `Ready`.
4. Execute `E2E_BASE_URL=https://SEU_DOMINIO npm run test:e2e` usando somente a conta piloto.
5. Confirme `/api/health`, cadastro, login e agendamento público.
6. Registre o commit implantado e qualquer cenário ignorado ou falho.

O cenário que conclui um atendimento e cria lançamento financeiro exige confirmação explícita com `E2E_FINANCIAL_MUTATION_CONFIRM=complete-pilot-appointment`.

## Supabase e recuperação

- **Estado verificado em 24/08/2026:** o projeto `marc-production` está no plano Free do Supabase, que não inclui backups agendados. Este é um bloqueio P0 para dados reais.
- **Decisão de 24/08/2026:** o upgrade foi adiado. Enquanto não houver backup, limitar as rodadas a contas internas e dados sintéticos; não iniciar operação externa com dados reais.
- Antes do primeiro piloto externo com dados reais, migrar para um plano com backup, confirmar a retenção disponível e registrar a primeira cópia concluída.
- Antes de migrations destrutivas, gere um backup ou confirme um ponto de recuperação recente.
- Migrations devem ser aditivas sempre que possível; nenhuma correção de interface justifica alterar dados de produção.
- Em incidente de integridade, suspenda novos agendamentos, preserve logs e eventos de auditoria e restaure somente após identificar o intervalo afetado.

## Triagem de incidentes

1. Verifique `/api/health` e o status do deploy na Vercel.
2. Consulte eventos `marc_request_error` pelo commit de release e rota.
3. Consulte `operational_audit_events`, `appointment_events` e `subscription_events` sem exportar dados pessoais.
4. Reproduza no estabelecimento piloto, nunca no estabelecimento do cliente.
5. Após a correção, execute o cenário E2E correspondente e documente causa, impacto e prevenção.

## Integrações pendentes

- E-mail automático: configurar `RESEND_API_KEY` e `EMAIL_FROM` após validar o domínio remetente.
- Monitoramento externo: conectar `/api/health` ao serviço escolhido pela Launcher.
- Stripe, Google e WhatsApp seguem os critérios registrados em `PRODUCT.md` e não bloqueiam o piloto assistido.

## Suporte do piloto

- O protocolo inicial está em `docs/pilot-support.md`.
- Calebe Alves e Alan Pires compartilham o suporte das 8h às 22h (horário de Brasília), durante as rodadas combinadas.
- O e-mail é o registro oficial; a contingência P1 deve ser combinada com cada participante enquanto não houver telefone ou grupo dedicado.

## Transparência e documentos legais

- A aplicação já apresenta Termos de Uso, Política de Privacidade e avisos junto ao cadastro e ao agendamento público.
- A identificação pública usa `58.199.674 Alan de Souza Pires`, CNPJ `58.199.674/0001-47`, e o endereço de contato informado: Rua João Marques Ferreira, 312 — Praça Cruzeiro, Rio Bonito — RJ.
- Antes do primeiro piloto externo, submeter o conteúdo à revisão jurídica e confirmar se o endereço de contato deve permanecer diferente do endereço cadastral constante no comprovante de CNPJ. A implementação atual é uma base operacional de transparência, não um parecer jurídico.

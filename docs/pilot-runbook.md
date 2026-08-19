# Piloto assistido do Marc

Este roteiro usa somente o estabelecimento dedicado `Estúdio Piloto Marc`. Nunca execute os comandos de provisionamento ou limpeza em um estabelecimento real.

## Preparação

1. Confirme que `.env.local` contém `E2E_EMAIL`, `E2E_PASSWORD` e `E2E_ESTABLISHMENT_SLUG`.
2. Provisione o estabelecimento, quando necessário, com `E2E_PROVISION_CONFIRM=provision-dedicated-pilot npm run pilot:provision`.
3. Provisione gerente, recepção e profissional com `E2E_ROLE_PROVISION_CONFIRM=provision-role-matrix npm run pilot:roles`.
4. Abra `/master`, selecione o estabelecimento piloto e confirme os cinco itens automáticos do checklist.

As credenciais de cada papel permanecem somente em `.env.local`. Elas não são exibidas no painel Master, não entram no Git e não aparecem nos eventos operacionais.

## Rodada 1 — fluxo feliz

- Dono cadastra ou revisa serviço, disponibilidade e dados públicos.
- Cliente agenda pela página pública.
- Recepção encontra o cliente e o horário na agenda geral.
- Gerente confirma, inicia e conclui o atendimento.
- A entrada automática aparece no financeiro.
- Gerente registra uma saída e fecha o caixa.
- Gerente consulta o relatório, exporta a planilha e salva o PDF.

Resultado esperado: o fluxo termina sem perda de contexto, duplicação ou recarga integral da interface. Marque `Agendamento público` e `Relatório e exportação` no Master.

## Rodada 2 — erros e permissões

- Dois clientes tentam ocupar o mesmo horário.
- A recepção tenta acessar financeiro e relatórios.
- O profissional tenta ver a agenda de outra pessoa.
- Um horário é reagendado, cancelado e enviado à lista de espera.
- Uma despesa é corrigida e estornada.
- Um fechamento é reaberto com motivo e fechado novamente.

Resultado esperado: o banco rejeita conflitos, cada papel enxerga apenas seu escopo e toda correção sensível deixa histórico. Registre qualquer falha P1 ou P2 no Master.

## Rodada 3 — uso diário no celular

- Instale o PWA pela URL de produção.
- Navegue pelas cinco abas sem recarga integral.
- Crie cliente, serviço e agendamento pelos sheets móveis.
- Feche e retome o PWA, inclusive após perda temporária de rede.
- Confirme safe areas, teclado, carregamento, botões de voltar e fechamento por gesto ou botão.

Resultado esperado: a operação principal funciona como um aplicativo instalado. Marque `Uso mobile como PWA` no Master.

## Prioridades e encerramento

- **P1:** impede a tarefa principal, perde dados ou viola permissão. A rodada para.
- **P2:** causa erro funcional ou atrito relevante. Deve ser resolvido antes da rodada seguinte.
- **P3:** melhoria visual ou de conveniência. Pode seguir para o backlog.

O piloto pode ser marcado como concluído apenas com todos os oito itens validados, nenhum P1/P2 aberto e as três rodadas executadas.

## Limpeza segura

Os testes automatizados removem seus próprios clientes e horários. Se uma execução for interrompida, use `PILOT_RESET_CONFIRM=reset-known-e2e-data npm run pilot:reset`. O script remove somente telefones reservados pela suíte e o bloqueio E2E conhecido. Configuração, matriz de papéis, auditoria, lançamentos financeiros e problemas do piloto são preservados.

# Relatório de lacunas e evolução do Marc

**Atualizado em:** 30 de agosto de 2026
**Base da auditoria:** código Next.js, migrations Supabase, suíte de testes, `PRODUCT.md`, `implementation-plan.md` e runbooks operacionais.

## 1. Resumo executivo

O Marc já funciona como **MVP operacional para piloto assistido**. Um estabelecimento consegue criar a conta, configurar equipe, serviços e disponibilidade, receber agendamentos públicos, operar a agenda, gerenciar clientes, lista de espera, caixa, comissões e relatórios. A aplicação também possui trial de 14 dias, PWA instalável, papéis distintos, painel Master e uma suíte E2E dedicada.

O produto ainda não está completo para lançamento comercial autônomo em escala. O que falta se divide em quatro grupos:

1. **Fechamento do piloto e operação de produção:** validação humana em celulares reais, monitoramento externo, backups e processo de suporte.
2. **Autoatendimento do cliente final:** a primeira área do cliente já está implementada por link seguro; regras comerciais de antecedência e entrega automática do acesso ainda precisam ser definidas.
3. **Ativação comercial e de comunicação:** Stripe, Resend, Google e WhatsApp têm fundações ou decisões registradas, mas dependem de contas, credenciais e regras externas.
4. **Expansão de produto:** regras de planos, multiunidades, estoque, fidelidade, sinal antecipado, Google Calendar, Hub e ferramentas globais mais completas no Master.

### Leitura de prioridade

- **P0 — antes do primeiro piloto externo:** segurança operacional e validação do fluxo real.
- **P1 — antes ou logo após o lançamento comercial:** reduz risco, suporte manual ou inconsistência comercial.
- **P2 — expansão de valor e retenção:** importante depois que o núcleo estiver estável.
- **P3 — escala estratégica:** depende de base ativa, operação madura ou integrações maiores.
- **Standby:** implementação depende de conta, credencial ou decisão que ainda não está disponível.

## 2. O que já está implementado

### Estabelecimento e equipe

- Cadastro, login por e-mail, recuperação e troca de senha.
- Onboarding do estabelecimento e trial automático de 14 dias.
- Papéis de dono, gerente, recepção e profissional com escopos distintos.
- Convites com validade, renovação, revogação e link copiável.
- Cadastro, edição, desativação e reativação de profissionais.
- Serviços, preço, duração, disponibilidade semanal, folgas e bloqueios.

### Agenda e relacionamento

- Agenda geral no desktop e timeline no mobile.
- Agenda individual restrita ao profissional conectado.
- Agendamento público por serviço, profissional, data e horário.
- Proteção contra conflito, datas passadas, preço adulterado e referências externas.
- Confirmação interna, início, conclusão, cancelamento, falta e reagendamento.
- Lista de espera e conversão em horário confirmado.
- Cadastro, busca, histórico, edição e arquivamento de clientes.
- Área do cliente por link seguro e revogável, com próximos horários, histórico, cancelamento, reagendamento, lista de espera, atualização de dados e ação para agendar novamente.

### Financeiro e gestão

- Entrada automática ao concluir atendimento.
- Despesas manuais, correção, estorno e trilha de auditoria.
- Fechamento diário por forma de pagamento e reabertura justificada.
- Comissão por profissional, com fotografia da taxa usada no atendimento.
- Relatórios mensais, indicadores, exportação CSV compatível com Excel e impressão/PDF.

### Plataforma e operação

- PWA instalável com navegação mobile persistente e shell offline seguro.
- Trial, bloqueio por vencimento e histórico de assinatura.
- Fundação de Stripe Checkout, Customer Portal e webhook idempotente.
- Painel Master para estabelecimentos, assinaturas e piloto assistido.
- Health check, eventos operacionais sem dados pessoais e runbook de produção.
- Suíte de testes unitários, segurança, integridade, responsividade e E2E por papel.

## 3. Lacunas prioritárias

### P0 — concluir antes do primeiro piloto externo

| Item | Estado atual | O que falta para concluir |
|---|---|---|
| Executar as três rodadas do piloto | Infraestrutura, contas e checklist existem | Rodar fluxo feliz, erros/permissões e uso diário em celulares reais; encerrar sem P1/P2 aberto. |
| Monitoramento externo | Workflow externo de 5 minutos implementado, com duas tentativas e incidente único no GitHub | Publicar o workflow, validar a primeira execução e confirmar o responsável pelo alerta. |
| Backup e recuperação | Verificado em 24/08/2026: o plano Free do Supabase não possui backups agendados; upgrade adiado por decisão dos responsáveis | Manter somente dados sintéticos nas rodadas internas; migrar para um plano com backup antes de dados reais, confirmar a primeira cópia e testar restauração. |
| Suporte do piloto | Calebe Alves e Alan Pires, das 8h às 22h, com canal, prioridades, triagem e SLAs em `docs/pilot-support.md` | Combinar a contingência P1 com cada participante enquanto não houver telefone ou grupo dedicado. |
| Aceite em dispositivos reais | Testes automatizados cobrem breakpoints | Validar iPhone/Android reais, teclado, instalação PWA, retomada, rede instável, sheets e safe areas. |
| Privacidade mínima | Termos, Política, avisos de coleta, identificação `58.199.674 Alan de Souza Pires`, CNPJ e endereço de contato implementados; exportação, solicitações, encerramento, fila administrativa auditável e matriz operacional de retenção estão disponíveis | Confirmar a divergência entre endereço de contato e endereço cadastral, validar juridicamente e contabilmente os prazos propostos e só então automatizar expirações. |

Esses itens não exigem WhatsApp, Resend ou Stripe e são o caminho mais curto para colocar um estabelecimento real em operação assistida.

### P1 — fechamento do produto comercial

#### 3.1 Área do cliente final

**Estado atual:** a primeira versão está implementada. O agendamento público entrega um link individual de 64 caracteres válido por 90 dias; o banco guarda apenas o hash. O cliente consulta próximos horários e histórico, cancela e reagenda, acompanha ou abandona a lista de espera, atualiza nome/telefone/e-mail e agenda novamente. A equipe pode gerar ou rotacionar o link na ficha do cliente, e todas as alterações relevantes deixam auditoria sem PII nos metadados.

**Controles concluídos:**

- rota sem IDs internos e marcada como `noindex`;
- token criptograficamente aleatório, revogável, rotacionado por cliente e armazenado somente como SHA-256;
- todas as consultas e mutações limitadas ao estabelecimento e cliente resolvidos pelo token;
- reagendamento revalida disponibilidade, folgas, duração e conflitos;
- cancelamento devolve a vaga imediatamente à agenda;
- link pode ser substituído pela equipe quando houver suspeita de compartilhamento;
- equipe visualiza se há acesso ativo e pode revogá-lo imediatamente sem apagar horários ou cadastro;
- mutações do portal possuem limite dedicado por cliente, com serialização no banco;
- “agendar novamente” reaproveita o último serviço e profissional sem colocar dados pessoais na URL;
- E2E cobre criação pública, abertura do portal e cancelamento.

**Ainda falta evoluir:**

- definir e expor antecedência mínima para cancelar ou reagendar;
- decidir se algum estabelecimento poderá bloquear cancelamento após confirmação;
- tratamento de sinal pago quando essa função existir;
- política para cliente marcado como falta;
- entrega automática e recuperação do link por Resend ou WhatsApp;
- ampliar a recuperação do acesso quando os canais transacionais estiverem disponíveis;

Uma conta completa com senha, Google ou WhatsApp deve vir depois, quando fidelidade, pagamentos, favoritos e uso em vários estabelecimentos justificarem o atrito adicional.

#### 3.2 Regras de agenda configuráveis

**Implementado:** dono e gerente configuram antecedência mínima, janela de 14/30/60 dias, prazo de cancelamento/reagendamento e confirmação automática ou manual. Cada profissional configura buffers antes/depois por serviço. As regras são verificadas no banco, inclusive em concorrência, e aparecem no agendamento público e na área do cliente.

Ainda faltam controles para:

- intervalo de almoço ou múltiplos períodos no mesmo dia;
- limite de reservas futuras por cliente;
- fuso horário editável para estabelecimentos fora de São Paulo;
- recorrência de horários internos, caso seja confirmada como necessária.

A lista de espera já pode ser convertida manualmente pela equipe. Ainda falta o fluxo realmente automático: detectar a vaga liberada, selecionar solicitações compatíveis, contatar o cliente, reservar por prazo curto e avançar para a próxima pessoa quando não houver resposta.

#### 3.3 Configuração e identidade pública

- Upload e recorte de logo do estabelecimento.
- Edição controlada do slug/link público.
- Horários públicos do negócio separados da disponibilidade individual.
- Fotos, descrição, redes sociais e instruções de chegada.
- Pré-visualização da página pública antes de publicar alterações.
- Alteração de e-mail da conta com reconfirmação.
- Avatar do usuário/profissional.

#### 3.4 Planos e permissões comerciais

Os preços estão confirmados, mas a composição ainda é ilustrativa. Falta:

- confirmar limites de profissionais, usuários, unidades e funcionalidades por plano;
- criar uma matriz de `entitlements` independente da interface;
- impor limites no banco/servidor, não apenas esconder botões;
- definir comportamento de downgrade quando o uso exceder o novo plano;
- definir tolerância de inadimplência, cancelamento, reembolso e proporcionalidade;
- alinhar landing page, checkout, Master e produto à mesma fonte de verdade.

#### 3.5 Conformidade e ciclo dos dados

- Termos de Uso e Política de Privacidade versionados.
- Consentimento/aviso adequado no agendamento público.
- Processo inicial de acesso, correção, portabilidade e exclusão solicitado pelo titular implementado no produto, incluindo fila operacional restrita, justificativa para decisões e histórico auditável. A matriz operacional de retenção está documentada e visível no Master; ainda falta validá-la com a assessoria responsável.
- Transformar os prazos propostos de retenção para clientes, agendamentos, auditoria e dados financeiros em política jurídica formal e, depois, em rotinas automatizadas auditáveis.
- Exportação estruturada dos dados do estabelecimento e encerramento protegido implementados para o proprietário.
- Anonimização de contatos no encerramento implementada, preservando histórico financeiro e auditoria. A política formal de retenção ainda precisa de revisão jurídica.
- Registro versionado de aceite dos Termos e da Política implementado no onboarding, nos convites e em Configurações, com hash imutável do conteúdo e retenção pseudonimizada da evidência após exclusão da conta. Ainda falta definir o procedimento jurídico e de comunicação que tornará um novo aceite obrigatório quando uma alteração futura for relevante.
- Revisão formal de permissões Master e proteção reforçada para administradores.

## 4. Integrações preparadas ou em standby

### Stripe — standby por configuração e decisões comerciais

**Já existe:** Checkout, Customer Portal, mapeamento de planos, webhook assinado e idempotência.

**Falta:**

- conta verificada, produtos, Price IDs e chaves de teste/produção;
- endpoint de webhook cadastrado e validado;
- testes de contratação, troca, inadimplência, cancelamento e reativação;
- regras de proporcionalidade, tolerância, reembolso e downgrade;
- conciliação e tratamento operacional de falhas de pagamento.

### Resend — standby por domínio e credenciais

**Já existe:** template e envio de convite com fallback por link copiável.

**Falta:** domínio validado, DNS, chave, remetente, testes de entrega e monitoramento de rejeições. Depois da ativação, expandir para recuperação operacional, comprovantes e comunicações do cliente.

### WhatsApp — standby por conta Meta e número dedicado

**Falta implementar após a infraestrutura oficial estar disponível:**

- templates aprovados pela Meta;
- fila de envio, retentativas, idempotência e status de entrega;
- lembrete antes do atendimento;
- confirmação/cancelamento com ação segura;
- resposta refletida na agenda;
- opt-in, opt-out e registro de consentimento;
- limites, custos e observabilidade;
- OTP por WhatsApp, somente se esse método de acesso continuar no escopo.

### Google

- OAuth está implementado atrás de flag, mas falta configurar e validar o provedor no Supabase.
- Sincronização com Google Calendar ainda não existe: será necessário OAuth por profissional, armazenamento seguro de tokens, sync bidirecional, tratamento de recorrência, conflitos e revogação.
- Ao combinar e-mail, Google e um futuro acesso por WhatsApp, será necessário vincular identidades com segurança para impedir contas duplicadas ou associação indevida.

## 5. Retenção e CRM — P2

- Data de nascimento no cadastro do cliente.
- Notificação de aniversário e campanhas de retorno.
- Segmentos como recorrentes, inativos, faltosos e alto valor.
- Tags e preferências estruturadas, além do campo livre de observações.
- Identificação e fusão assistida de cadastros duplicados.
- Lembrete de retorno baseado no último serviço.
- Campanhas com consentimento, frequência e descadastro.
- Métricas de retenção, recorrência, reativação e no-show por segmento.

## 6. Recursos de escala — P2/P3

### Multiunidades

O banco relaciona cada acesso a um estabelecimento, mas o contexto atual escolhe apenas uma associação e o cabeçalho não oferece troca. Falta:

- organização/rede proprietária das unidades;
- seletor real de estabelecimento;
- permissões por unidade e acesso consolidado do dono;
- relatórios, financeiro e equipe consolidados ou filtráveis;
- regras de plano e cobrança por rede/unidade;
- possibilidade de mover ou compartilhar profissionais conforme regra definida.

### Sinal antecipado e pagamentos de atendimento

- política de sinal por serviço/profissional;
- checkout do cliente e expiração da reserva;
- confirmação somente após pagamento quando aplicável;
- estorno, cancelamento, no-show e conciliação;
- vínculo entre pagamento, agendamento e caixa;
- tratamento de taxas e repasse ao estabelecimento.

### Estoque

- catálogo de produtos/insumos e unidades de medida;
- entradas, saídas, perdas, inventário e fornecedor;
- consumo opcional por serviço;
- custo, margem e alertas de estoque mínimo;
- permissões e auditoria de ajustes.

### Fidelidade e cashback

- regras de pontos/cashback por estabelecimento;
- carteira e razão imutável de movimentações;
- validade, resgate, estorno e prevenção de fraude;
- visualização no portal do cliente;
- impacto contábil e regras comerciais.

### Hub de descoberta Marc

- perfil público enriquecido e moderação;
- geolocalização, raio, categoria e disponibilidade pesquisável;
- busca e ranking transparentes;
- sugestão de alternativa quando não houver vaga;
- consentimento do estabelecimento e governança de destaque;
- métricas de encaminhamento e conversão;
- ferramentas Master para moderação e suporte;
- regras de privacidade, qualidade e combate a abuso.

O Hub deve ser construído apenas quando houver densidade suficiente de estabelecimentos ativos em uma mesma região.

## 7. Evolução do painel Master — P2

O Master atual acompanha estabelecimentos, assinatura e piloto. Para a operação completa faltam:

- pesquisa e filtros globais;
- gestão de usuários e papéis da plataforma;
- visão de saúde, erros, uso e funil de ativação;
- feature flags por ambiente, plano ou estabelecimento;
- histórico consolidado de intervenções administrativas;
- ferramentas de suporte sem acesso irrestrito a dados pessoais;
- suspensão/reactivação operacional com motivo;
- gestão de cobrança, exceções comerciais e créditos;
- moderação do futuro Hub;
- métricas globais de receita, retenção, churn e atividade.

Qualquer função de acesso assistido ou impersonação deve exigir motivo, prazo curto, permissão elevada e auditoria visível.

## 8. Qualidade, segurança e operação contínua

### Observabilidade

- serviço externo para erros e alertas, além dos logs da Vercel;
- correlação por release e identificador técnico, sem PII;
- métricas de latência, taxa de erro e falhas de integração;
- painel e alertas para filas futuras de e-mail/WhatsApp/Calendar;
- analytics de produto com política de privacidade e eventos mínimos.

### Segurança

- revisão periódica das RLS e RPCs com testes negativos.
- rotação documentada de chaves e resposta a vazamento.
- MFA ou requisito equivalente para contas Master.
- proteção contra abuso no cadastro/login, além do limite existente no agendamento.
- política de sessão, revogação de dispositivos e encerramento global de sessões.
- varredura de dependências e rotina de atualização.
- teste de restauração e exercício de incidente.

### Desempenho e acessibilidade

- orçamento de Core Web Vitals para landing, autenticação e aplicação.
- paginação ou carregamento progressivo para bases grandes de clientes e agenda.
- auditoria WCAG AA completa em temas claro/escuro.
- testes com leitor de tela, teclado, zoom e contraste forçado.
- matriz real de Safari iOS, Chrome Android e navegadores desktop suportados.

### Testes ainda desejáveis

- E2E de reagendamento, atualização de perfil, lista de espera e rotação do link do portal do cliente.
- E2E de fechamento/reabertura e exportação em produção piloto controlada.
- E2E de assinatura Stripe em modo de teste.
- testes de migração sobre uma cópia anonimizada do banco.
- testes de carga do agendamento público e concorrência em volume.
- testes de recuperação após indisponibilidade do Supabase e integrações.

## 9. Comercial, conteúdo e lançamento

- Confirmar benefícios e limites reais de Starter, Pro e Max.
- Definir onboarding e suporte incluídos em cada plano.
- Publicar política de cancelamento, reembolso e inadimplência.
- Substituir métricas, depoimentos e estabelecimentos ilustrativos por evidência autorizada.
- Configurar domínio principal, remetentes e identidade final de produção.
- Criar base de ajuda, perguntas frequentes operacionais e roteiro de treinamento.
- Definir suporte, atendimento comercial e processo de escalonamento.
- Instrumentar conversão: visita, cadastro, onboarding, primeiro serviço, primeiro agendamento e primeiro atendimento concluído.
- Preparar testes A/B da landing somente depois de existir volume suficiente e uma métrica de conversão confiável.
- Corrigir divergências de documentação: `PRODUCT.md` confirma os três preços, enquanto o runbook antigo de Stripe ainda lista os valores como decisão pendente.

## 10. Sequência recomendada

### Etapa A — fechar o piloto assistido

1. Configurar monitoramento e confirmar backup.
2. Publicar documentos mínimos de privacidade e termos.
3. Executar as três rodadas em celulares reais.
4. Corrigir todos os P1/P2 e registrar P3 no backlog.
5. Repetir os cenários críticos na URL de produção.

### Etapa B — autoatendimento e regras

1. Validar com usuários os defaults já implementados de cancelamento, reagendamento e antecedência.
2. Evoluir a entrega do link do cliente quando Resend ou WhatsApp estiver disponível.
3. Expor horários públicos separados, fuso, logo e link personalizado.
4. Implementar direitos de dados e encerramento de conta.

### Etapa C — lançamento comercial

1. Confirmar composição e limites dos planos.
2. Implementar `entitlements` e enforcement no servidor.
3. Ativar Stripe quando a conta estiver pronta.
4. Ativar Resend e Google conforme disponibilidade.
5. Medir ativação, suporte e conversão dos primeiros clientes pagantes.

### Etapa D — retenção

1. Aniversários, segmentação e reengajamento.
2. WhatsApp oficial quando a Meta estiver disponível.
3. Melhorias do portal do cliente, incluindo conta completa se houver valor comprovado.

### Etapa E — escala

1. Multiunidades.
2. Google Calendar e sinal antecipado.
3. Estoque e fidelidade.
4. Master ampliado.
5. Hub de descoberta após existir densidade regional.

## 11. Critério de “produto completo”

O Marc pode ser considerado pronto para comercialização inicial quando:

- o piloto real terminar sem P1/P2;
- monitoramento, backup, suporte, termos e privacidade estiverem ativos;
- planos e limites forem verdadeiros e aplicados pelo servidor;
- cobrança estiver ativa ou existir um processo manual comercial confiável;
- o estabelecimento conseguir operar sem intervenção diária da Launcher;
- clientes conseguirem ao menos consultar e administrar seus horários por um mecanismo seguro;
- as promessas públicas diferenciarem claramente recursos disponíveis e planejados.

O escopo completo descrito no plano original somente estará concluído depois de multiunidades, pagamentos de atendimento, estoque, fidelidade, Google Calendar, automações, Master ampliado e Hub. Esses módulos não devem bloquear o aprendizado com os primeiros pilotos.

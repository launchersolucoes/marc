# Plano de Implementação — Plataforma Marc

Este documento organiza a construção da plataforma (não só a landing page) por ordem de prioridade: primeiro o que é vital para o negócio funcionar, depois o que aumenta retenção e receita, depois o que permite escalar.

## Estado atual e fonte de verdade

O núcleo do MVP já está implementado e em endurecimento para piloto assistido: autenticação por e-mail, onboarding, equipe e permissões, serviços, disponibilidade, agenda, clientes, agendamento público, lista de espera, financeiro, comissões, relatórios, trial e painel Master.

O ciclo de vida operacional de profissionais, convites, clientes e ofertas também está implementado: edição, desativação ou arquivamento sem apagar histórico, renovação e revogação de convites e proteção contra arquivar pessoas com atendimentos futuros. A migração `20260818120000_entity_lifecycle_management.sql` foi aplicada e registrada no Supabase de produção.

A experiência PWA agora possui manifesto instalável, atalhos de agenda, instalação guiada no Android/iOS, shell seguro para falta de conexão e registro de service worker. Páginas autenticadas e dados operacionais continuam sempre dependentes da rede e não são gravados no cache do dispositivo.

Relatórios mensais podem ser exportados como planilha compatível com Excel e impressos ou salvos em PDF. A exportação é isolada por estabelecimento, restrita a dono/gerente e neutraliza conteúdo que poderia ser interpretado como fórmula pela planilha.

`PRODUCT.md` é a fonte de verdade para decisões atuais. WhatsApp, OTP por telefone, Hub, multiunidades, estoque, fidelidade e cobrança automática permanecem fora do caminho crítico do piloto até que as contas, credenciais e regras comerciais necessárias sejam confirmadas.

---

## 1. Autenticação

Três formas de entrada, todas gerando a mesma identidade de usuário no sistema:

1. **Login com Google** (OAuth 2.0)
2. **Criação de conta normal** (e-mail + senha)
3. **Criar conta / login pelo número de WhatsApp** — o número é validado por **código OTP enviado via WhatsApp em todo login**, não só no cadastro. Ou seja, quem opta por esse método sempre recebe e confirma um código a cada novo acesso (não fica logado indefinidamente sem revalidar o número).

**Observações de implementação:**
- Um mesmo usuário pode ter e-mail e WhatsApp vinculados à mesma conta (evitar contas duplicadas quando a pessoa alterna o método de entrada — checar por telefone/e-mail já cadastrado antes de criar novo registro).
- Sessão via JWT/refresh token padrão para Google e e-mail/senha; para o fluxo WhatsApp, o próprio código OTP é o segundo fator obrigatório a cada login (não é "lembrar dispositivo" — reforça segurança, já que o número de WhatsApp costuma ser também o canal de agendamento do cliente).
- Rate limit e expiração curta (ex.: 5 minutos) para os códigos OTP, com bloqueio temporário após tentativas inválidas repetidas.

---

## 2. Papéis (roles) e permissões

| Papel | Escopo | Descrição |
|---|---|---|
| **Cliente** | Público | Agenda horários, recebe lembretes, usa o Hub de descoberta |
| **Profissional** | 1 estabelecimento | Vê e gerencia a própria agenda, bloqueia horários, vê sua comissão |
| **Admin/Recepção** | 1 estabelecimento | Gerencia agenda de todos os profissionais, financeiro, cadastro de serviços (plano Pro+) |
| **Dono/Gestor do estabelecimento** | 1 ou mais unidades (Max) | Acesso total ao(s) estabelecimento(s): financeiro, comissões, relatórios, multi-unidades |
| **Master (equipe Marc)** | Toda a plataforma | Controle absoluto: gestão de todos os estabelecimentos, usuários, planos e cobrança, moderação do Hub, feature flags, suporte, métricas globais |

A conta **Master** é interna (da equipe do Marc) e não é vendida como plano — é o papel de administração da plataforma como um todo, incluindo o próprio Hub de descoberta.

---

## 3. Hub de descoberta Marc

Marketplace interno que conecta todos os estabelecimentos parceiros (barbearias, salões, esmalterias e afins) em um só lugar:
- Cliente que não encontra horário no estabelecimento favorito é direcionado a alternativas próximas dentro do ecossistema Marc.
- Estabelecimento ganha visibilidade e novos clientes só por estar na plataforma, sem esforço extra.
- Gestão do Hub (destaque, moderação, geolocalização, categorias) fica sob controle da conta Master.
- Funciona como recurso da plataforma como um todo — disponível a todos os planos pagantes, não é um item de upsell entre Starter/Pro/Max.

---

## 4. Fases de implementação (da mais vital para a mais avançada)

### Fase 0 — Fundação técnica
Pré-requisito de tudo. Sem isso, nada mais funciona.
- Modelagem de dados (usuários, estabelecimentos, profissionais, serviços, agendamentos)
- Autenticação (Google, e-mail/senha, WhatsApp + OTP) e definição de papéis
- Design system aplicado (tema claro/escuro, componentes base)
- Infraestrutura de envio de WhatsApp (em espera até existir conta empresarial e número dedicado)

### Fase 1 — MVP vital (equivalente ao plano Starter)
O mínimo para um estabelecimento sair do caderno/WhatsApp manual e o Marc já gerar valor real.
1. Cadastro de serviços e preços
2. Agendamento online 24h (página pública do estabelecimento)
3. Confirmação automática de agendamento
4. Lembretes automáticos no WhatsApp *(evolução posterior; não bloqueia o piloto assistido)*
5. Gestão financeira básica (caixa diário)
6. Histórico de clientes
7. Página de agendamento personalizada (link próprio)

> Critério atual de saída da Fase 1: um estabelecimento consegue operar agenda, clientes e financeiro pelo Marc; lembretes continuam manuais até a ativação do WhatsApp.

### Fase 2 — Gestão de time (equivalente ao plano Pro)
Necessário assim que o estabelecimento tem mais de um profissional.
1. Agenda individual por profissional
2. Múltiplos usuários com permissões (admin/recepção/profissional)
3. Bloqueio de horários e folgas
4. Controle de comissão por profissional
5. Relatórios e dashboard de faturamento
6. Lista de espera / reagendamento automático
7. Notificação de aniversário do cliente

### Fase 3 — Escala e retenção (equivalente ao plano Max)
Para redes e negócios maduros, e para aumentar receita recorrente.
1. Multi-unidades
2. Cobrança online / sinal antecipado
3. Controle de estoque de produtos
4. Programa de fidelidade / cashback
5. Exportação de relatórios (PDF/Excel)
6. Integração com Google Calendar
7. Suporte prioritário / onboarding assistido

### Fase 4 — Hub de descoberta + conta Master
Depende de já haver uma base de estabelecimentos ativos (Fases 1–2 em produção) para o Hub fazer sentido.
1. Painel Master (controle total da plataforma: usuários, estabelecimentos, planos, cobrança, moderação)
2. Cadastro/categorização de estabelecimentos no Hub (barbearia, salão, esmalteria etc.)
3. Busca e sugestão de estabelecimentos alternativos por geolocalização/disponibilidade
4. Métricas globais e ferramentas de suporte para a equipe Marc

### Fase 5 — Refino e crescimento
1. Tema claro/escuro completo (landing page já na Fase 0, plataforma logada revisada e testada aqui)
2. Testes A/B de conversão na landing page
3. Otimizações de performance e acessibilidade (contraste AA nos dois temas)
4. Automação de marketing (aniversário, reengajamento, campanhas via Hub)

---

## 5. Resumo de priorização

**Vital primeiro, sempre:** autenticação + agendamento online + agenda interna + financeiro básico. O lembrete pelo WhatsApp continua importante, mas foi separado do piloto até a infraestrutura oficial estar disponível.

**Depois:** tudo que envolve gerenciar um time (Pro) — só é urgente quando o estabelecimento já tem mais de 1 profissional.

**Por último:** funcionalidades de escala/rede (Max) e o Hub — exigem base de usuários e estabelecimentos já ativa para gerar valor real.

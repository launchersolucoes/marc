# Prompt para o Codex — Landing Page do Marc

Crie a landing page completa do **Marc**, um sistema web de agendamentos para barbearias, salões e esmalterias. Siga rigorosamente o arquivo `design.md` para cores, tipografia, espaçamento e estilo dos componentes — ele é a fonte de verdade da identidade visual, incluindo os tokens de **tema claro e escuro**. Use a fonte Instrument Sans (Google Fonts) e o gradiente oficial (versão dark e versão light) descrito no design system para o hero e para a seção final de CTA.

## Stack
Next.js + React + Tailwind CSS (`darkMode: 'class'`), componentizado, responsivo (mobile-first), single page (`/`), sem backend — apenas front-end estático com âncoras entre seções. Ícones: lucide-react (outline, 2px). Não usar bibliotecas de UI genéricas que fujam da identidade.

## Tema claro/escuro (obrigatório)
- Toggle de tema visível no header (ícone sol/lua), persistido em `localStorage`, com fallback para `prefers-color-scheme`.
- Tema escuro é o padrão. Todos os componentes devem consumir os tokens CSS definidos em `design.md` (nunca hex fixo em componente).
- Testar visualmente as duas versões do gradiente do hero (dark e light) antes de finalizar.

## Objetivo da página
Converter donos de barbearias, salões e esmalterias em trial/cadastro do Marc. A página precisa deixar claro, em poucos segundos, por que usar o Marc é melhor do que continuar agendando "no caderno", no WhatsApp manual ou em planilhas — **e evidenciar o conjunto completo de funcionalidades da plataforma**, não só um resumo genérico.

## Estrutura de seções (nessa ordem)

1. **Header fixo**
   Logo Marc (mascote + wordmark) à esquerda, menu (Funcionalidades, Planos, Depoimentos, FAQ), toggle de tema, CTA "Começar agora" à direita. Fundo transparente que ganha leve blur/background ao rolar.

2. **Hero**
   - Headline forte em 2–3 linhas, com uma palavra/expressão em `--accent` (ex.: "Sua agenda **sempre cheia**, sem esforço.")
   - Subheadline curta: o Marc organiza agendamentos, lembra clientes no WhatsApp e cuida das finanças da sua barbearia, salão ou esmalteria, tudo em um só lugar.
   - Prova social: fileira de avatares + "+X estabelecimentos confiam no Marc" (placeholder de número).
   - Dois CTAs: primário "Começar agora — 7 dias grátis" e secundário "Ver como funciona".
   - Mockup do produto (dashboard/app de agenda, placeholder) flutuando à direita com glow sutil em `--accent`.

3. **Seção de dor (o problema sem o Marc)**
   Título: "Se isso parece familiar, seu negócio está perdendo dinheiro todo mês."
   - Clientes esquecem o horário e faltam sem avisar
   - Agenda no caderno ou no WhatsApp manual, com choque de horários
   - Zero controle real do faturamento e da comissão de cada profissional
   - Tempo perdido confirmando agendamento um por um
   - Cliente desiste de marcar porque só dá pra agendar por mensagem, em horário comercial

4. **Seção de solução** — espelho da anterior, mostrando os ganhos diretos de usar o Marc.

5. **Grid completo de funcionalidades**
   Renderizar **todas** as funcionalidades abaixo (não resumir), organizadas em cards com ícone + título + descrição curta do diferencial. Agrupar visualmente em 3 blocos por nível ("Essencial", "Time", "Escala") para já preparar o terreno para o pricing, mas sem esconder nenhum recurso do usuário que ainda não decidiu o plano:

   **Essencial** (todo estabelecimento precisa)
   - Agendamento online 24h — cliente marca sozinho, sem depender de horário comercial
   - Lembretes automáticos no WhatsApp — reduz faltas de forma direta
   - Confirmação automática de agendamento — sem ligação manual
   - Cadastro de serviços e preços — agenda calcula o tempo sozinha
   - Página de agendamento personalizada (link próprio) — profissionaliza a marca
   - Histórico de clientes — identifica quem sumiu e permite reengajar
   - Gestão financeira básica (caixa diário) — faturamento em tempo real

   **Time** (para quem tem equipe)
   - Agenda individual por profissional
   - Bloqueio de horários e folgas
   - Controle de comissão por profissional
   - Relatórios e dashboard de faturamento
   - Lista de espera / reagendamento automático
   - Notificação de aniversário do cliente
   - Múltiplos usuários com permissões (admin/recepção/profissional)

   **Escala** (para redes e negócios grandes)
   - Multi-unidades
   - Cobrança online / sinal antecipado
   - Programa de fidelidade / cashback
   - Controle de estoque de produtos
   - Exportação de relatórios (PDF/Excel)
   - Integração com Google Calendar
   - Suporte prioritário / onboarding assistido

6. **Seção de destaque — WhatsApp**
   Bloco maior (texto + mockup de conversa) só sobre lembretes automáticos: menos faltas = mais dinheiro no fim do mês. Incluir número de impacto (placeholder, ex. "até 40% menos faltas").

7. **Seção de destaque — Hub de descoberta Marc**
   Bloco explicando o diferencial de rede: todos os estabelecimentos parceiros fazem parte de um hub de descoberta (barbearias, salões, esmalterias e afins). Se o cliente não encontra vaga no seu lugar favorito, o Marc sugere automaticamente outro estabelecimento parceiro próximo — ou seja, o dono do negócio pode ganhar novos clientes só por estar na plataforma, mesmo sem fazer nada. Deixar claro que isso é um diferencial de rede exclusivo do Marc, não uma funcionalidade isolada de cada plano.

8. **Estatísticas**
   3–4 números grandes (placeholders): estabelecimentos ativos, agendamentos por mês, redução média de faltas, tempo economizado por semana.

9. **Pricing**
   Três cards lado a lado, plano do meio (Pro) destacado com fundo `--accent` e texto `--text-on-accent`, badge "Mais popular" em `--accent-light`:

   - **Starter — R$ 29,90/mês**
     1 profissional · todas as funcionalidades do bloco "Essencial"

   - **Pro — R$ 49,90/mês** (destaque)
     5 profissionais · tudo do Starter + todas as funcionalidades do bloco "Time"

   - **Max — R$ 99,90/mês**
     15 profissionais · tudo do Pro + todas as funcionalidades do bloco "Escala"

   Cada card com lista de benefícios com check em `--accent` e botão "Assinar [nome do plano]". Nota abaixo do pricing: "Todos os planos incluem 7 dias grátis, sem cartão de crédito, e acesso ao Hub de descoberta Marc."

10. **Depoimentos**
    3 cards com avatar, nome, estabelecimento, estrelas e frase curta sobre resultado real. Conteúdo placeholder claramente editável.

11. **FAQ**
    Perguntas: "Preciso instalar algo?", "Meus clientes precisam baixar um app?", "Como funciona o lembrete no WhatsApp?", "O que é o Hub de descoberta Marc?", "Posso trocar de plano depois?".

12. **CTA final**
    Fundo com o gradiente oficial (dark/light conforme tema ativo), headline curta, botão primário grande.

13. **Footer**
    Logo, links rápidos, redes sociais, copyright "© 2026 Marc. Todos os direitos reservados."

## Diretrizes de copy
- Português do Brasil, direto e sem jargão técnico.
- Falar sempre em benefício concreto: tempo, dinheiro, menos faltas, mais clientes fiéis, novos clientes via hub.
- Reforçar a dor de continuar no modelo manual antes de apresentar cada benefício forte.
- CTAs sempre orientados a ação, nunca "Saiba mais" sozinho como único CTA.

## Diretrizes visuais
- Seguir exatamente cores, raio de borda (20px em cards), tracking de -8% em títulos e estilo de ícone outline 2px definidos em `design.md`.
- Usar o glow com extrema moderação — hero, card de pricing em destaque e seção do Hub.
- Todos os componentes responsivos e testados em mobile (maioria dos donos acessa pelo celular).
- Nenhum card de funcionalidade deve ficar sem descrição — o objetivo desta página é que o visitante veja o produto inteiro, não um resumo.

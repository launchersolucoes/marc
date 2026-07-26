# Prompt para o Codex — Landing Page do Marc

Crie a landing page completa do **Marc**, um sistema web de agendamentos para barbearias e salões de beleza. Siga rigorosamente o arquivo `design.md` (anexo/incluído no repositório) para cores, tipografia, espaçamento e estilo dos componentes — ele é a fonte de verdade da identidade visual. Use a fonte Instrument Sans (Google Fonts) e o gradiente oficial descrito no design system para o hero e para a seção final de CTA.

## Stack
Next.js + React + Tailwind CSS, componentizado, responsivo (mobile-first), single page (`/`), sem backend — apenas front-end estático com âncoras entre seções. Ícones: lucide-react (outline, 2px). Não usar bibliotecas de UI genéricas que fujam da identidade (nada de Bootstrap/Material).

## Objetivo da página
Converter donos e gerentes de barbearias e salões em trial/cadastro do Marc. A página precisa deixar claro, em poucos segundos de leitura, por que usar o Marc é melhor do que continuar agendando "no caderno", no WhatsApp manual ou em planilhas.

## Estrutura de seções (nessa ordem)

1. **Header fixo**
   Logo Marc (mascote + wordmark) à esquerda, menu (Funcionalidades, Planos, Depoimentos), CTA "Começar agora" à direita. Fundo transparente que ganha leve blur/background ao rolar.

2. **Hero**
   - Headline forte em 2–3 linhas, com uma palavra/expressão em `--accent` (ex.: "Sua agenda **sempre cheia**, sem esforço.")
   - Subheadline curta: o Marc organiza agendamentos, lembra clientes no WhatsApp e cuida das finanças da sua barbearia ou salão, tudo em um só lugar.
   - Prova social: fileira de avatares + "+X barbearias e salões confiam no Marc" (usar placeholder de número).
   - Dois CTAs: primário "Começar agora — 7 dias grátis" (botão verde) e secundário "Ver como funciona" (outline).
   - Mockup do produto (pode ser uma imagem placeholder de dashboard/app de agenda) flutuando à direita com glow sutil.

3. **Seção de dor (o problema sem o Marc)**
   Bloco direto listando as dores reais de quem ainda não usa um sistema de agendamento:
   - Clientes esquecem o horário e faltam sem avisar → cadeira vazia, dinheiro perdido
   - Agenda no caderno ou no WhatsApp manual, com choque de horários
   - Zero controle real do faturamento e da comissão de cada profissional
   - Tempo perdido confirmando agendamento um por um
   - Cliente desiste de marcar porque só dá para agendar por mensagem, em horário comercial
   Título sugerido: "Se isso parece familiar, sua barbearia está perdendo dinheiro todo mês."

4. **Seção de solução (por que o Marc resolve)**
   Transição para o positivo, mesma estrutura em espelho, mostrando o "antes x depois" ou diretamente os ganhos: menos faltas, agenda sempre organizada, cliente agenda sozinho 24h, financeiro automático, comissão calculada sozinha.

5. **Grid de funcionalidades** (6 cards, ícone + título + descrição curta)
   - Agendamento online 24h (cliente marca sozinho, sem precisar ligar ou chamar no WhatsApp)
   - Lembretes automáticos no WhatsApp (reduz faltas, avisa cliente antes do horário)
   - Gestão financeira integrada (entradas, saídas e faturamento em tempo real)
   - Agenda por profissional (cada barbeiro/cabeleireiro com sua própria agenda)
   - Controle de comissões (cálculo automático por profissional e serviço)
   - Relatórios e histórico de clientes (o que cada cliente mais pede, frequência, ticket médio)

6. **Seção de destaque — WhatsApp**
   Bloco maior (texto + mockup de conversa de WhatsApp) só sobre o diferencial dos lembretes automáticos: menos faltas = mais dinheiro no fim do mês. Incluir um número de impacto (placeholder, ex. "até 40% menos faltas").

7. **Estatísticas**
   3–4 números grandes em destaque (placeholders): barbearias/salões ativos, agendamentos feitos por mês, redução média de faltas, tempo economizado por semana.

8. **Pricing**
   Três cards lado a lado, plano do meio (Pro) destacado visualmente (fundo `--accent`, texto escuro, "Mais popular"):

   - **Starter — R$ 29,90/mês**
     1 profissional · agendamentos ilimitados · lembretes no WhatsApp · gestão financeira

   - **Pro — R$ 49,90/mês** (destaque / mais popular)
     5 profissionais · agendamentos ilimitados · lembretes no WhatsApp · gestão financeira

   - **Max — R$ 99,90/mês**
     15 profissionais · agendamentos ilimitados · lembretes no WhatsApp · gestão financeira

   Cada card com lista de benefícios com check verde e botão "Assinar [nome do plano]". Adicionar nota curta abaixo do pricing: "Todos os planos incluem 7 dias grátis, sem cartão de crédito."

9. **Depoimentos**
   3 cards com avatar, nome, nome do estabelecimento, estrelas e frase curta sobre resultado real (menos faltas, mais organização, tempo economizado). Usar conteúdo placeholder claramente editável.

10. **FAQ** (opcional, curto)
    3–4 perguntas: "Preciso instalar algo?", "Meus clientes precisam baixar um app?", "Como funciona o lembrete no WhatsApp?", "Posso trocar de plano depois?".

11. **CTA final**
    Fundo com o gradiente oficial, headline curta e direta, botão primário grande "Começar agora — 7 dias grátis".

12. **Footer**
    Logo, links rápidos, redes sociais, copyright "© 2026 Marc. Todos os direitos reservados."

## Diretrizes de copy
- Português do Brasil, direto e sem jargão técnico.
- Falar sempre em benefício concreto: tempo, dinheiro, menos faltas, mais clientes fiéis.
- Reforçar a dor de continuar no modelo manual (caderno/WhatsApp solto/planilha) antes de apresentar cada benefício forte.
- CTAs sempre orientados a ação: "Começar agora", "Assinar [plano]", nunca "Saiba mais" sozinho como único CTA.

## Diretrizes visuais
- Seguir exatamente as cores, raio de borda (20px em cards), tracking de -8% em títulos e o estilo de ícone outline 2px definidos em `design.md`.
- Manter muito espaço em branco entre seções, sem poluição visual.
- Usar o glow (`rgba(57,242,154,0.45)`) com extrema moderação — apenas atrás do mockup do hero e, se fizer sentido, atrás do card de pricing em destaque.
- Todos os componentes devem ser responsivos e testados em mobile (a maioria dos donos de barbearia vai acessar pelo celular).

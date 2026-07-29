# Design System — Marc

Sistema de agendamentos inteligente para barbearias, salões, esmalterias e afins.
Mascote: cachorro estilizado de óculos escuros, minimalista, geométrico, amigável.

> **Nota de versão:** paleta redefinida (laranja/dourado, sobre carvão ou branco gelo) e suporte oficial a **tema claro e escuro** — tanto na landing page quanto na plataforma logada.

---

## 1. Conceito da marca

Marc transmite **organização, simplicidade, tecnologia e personalidade**.
Palavras-chave: minimalista, premium, inteligente, tecnológico, moderno, confiável, organizado, amigável.

A sensação final deve ser de um produto que **"simplesmente funciona"** — sem excesso visual, com foco absoluto em clareza e experiência do usuário. Referências de estilo: Apple, Linear, Raycast, Vercel, Arc Browser, Notion Calendar.

---

## 2. Paleta de cores (fonte oficial)

| Função | Cor | Hex |
|---|---|---|
| Primária | Laranja | `#FFA500` |
| Primária Escura | Laranja Queimado | `#CC8400` |
| Primária Clara | Dourado Claro | `#FFC04D` |
| Fundo Escuro | Carvão | `#1A1A1A` |
| Fundo Claro | Branco Gelo | `#F8F9FA` |
| Texto Principal | Preto Suave | `#222222` |
| Texto em Fundo Escuro | Branco | `#FFFFFF` |
| Cinza | Neutro | `#6C757D` |

### Tokens — Tema Escuro (`data-theme="dark"`, padrão)

| Token | Hex | Uso |
|---|---|---|
| `--bg-primary` | `#1A1A1A` | Fundo principal |
| `--bg-secondary` | `#232323` | Seções alternadas |
| `--surface` | `#262626` | Cards, superfícies elevadas |
| `--border` | `#333333` | Bordas de cards e inputs |
| `--text-primary` | `#FFFFFF` | Títulos, texto principal |
| `--text-secondary` | `#B3B7BC` (Cinza `#6C757D` clareado ~25% para contraste em fundo escuro) | Subtítulos, texto de apoio |
| `--accent` | `#FFA500` | CTAs, ícones ativos, destaques |
| `--accent-hover` | `#CC8400` | Hover / estados ativos |
| `--accent-light` | `#FFC04D` | Detalhes, gráficos, badges |
| `--text-on-accent` | `#1A1A1A` | Texto sobre botão/superfície laranja |
| `--glow` | `rgba(255,165,0,0.35)` | Glow sutil atrás de elementos-chave |

### Tokens — Tema Claro (`data-theme="light"`)

| Token | Hex | Uso |
|---|---|---|
| `--bg-primary` | `#F8F9FA` | Fundo principal |
| `--bg-secondary` | `#FFFFFF` | Seções alternadas |
| `--surface` | `#FFFFFF` | Cards, superfícies elevadas |
| `--border` | `#E4E6E9` (derivado do Cinza `#6C757D`, clareado) | Bordas de cards e inputs |
| `--text-primary` | `#222222` | Títulos, texto principal |
| `--text-secondary` | `#6C757D` | Subtítulos, texto de apoio |
| `--accent` | `#FFA500` | CTAs, ícones ativos, destaques |
| `--accent-hover` | `#CC8400` | Hover / estados ativos |
| `--accent-light` | `#FFC04D` | Detalhes, gráficos, badges |
| `--text-on-accent` | `#1A1A1A` | Texto sobre botão/superfície laranja |
| `--glow` | `rgba(255,165,0,0.18)` | Glow sutil (mais discreto que no escuro) |

**Regra de contraste:** `--accent` (#FFA500) nunca recebe texto branco em cima — sempre `--text-on-accent` (#1A1A1A), pois o laranja é claro demais para texto branco manter legibilidade AA.

### Gradiente oficial (hero / seções de destaque)

O gradiente oficial é o shader WebGL animado implementado em `src/components/ui/animated-gradient.jsx`. Ele usa distorção orgânica e movimento lento, sem introduzir cores externas à marca.

- **Tema escuro:** base `#1A1A1A`, marrons profundos derivados do laranja (`#3A2108`, `#4A2500`, `#704000`, `#7A4300`) e destaques da interface em `#FFA500`.
- **Tema claro:** base `#F8F9FA`/`#FFFFFF`, transições `#FFF1CF`/`#FFE6AD` e laranja `#FFA500`/`#FFC04D`.
- **Hero:** padrão orgânico mais sutil para preservar a leitura do título e do mockup.
- **CTA final:** padrão mais expressivo, usado como pico visual antes do rodapé.
- **Acessibilidade e desempenho:** fallback sólido, pixel ratio limitado, pausa fora da viewport ou com a aba oculta e velocidade reduzida pela metade em `prefers-reduced-motion`.

Não reintroduzir os antigos `radial-gradient` e `linear-gradient` nessas superfícies.

---

## 3. Tipografia

- **Fonte principal:** Instrument Sans
- **Pesos:** Medium (500), SemiBold (600), Bold (700)
- **Tracking:** -8% (aproxima as letras, efeito mais premium) — aplicar em títulos grandes
- **Hierarquia:** títulos grandes e ousados, muito espaço em branco entre blocos, contraste forte entre H1/H2 e corpo de texto (`--text-secondary`)
- Texto sempre em `--text-primary` do tema ativo; nunca hardcodar branco/preto fora dos tokens.

---

## 4. Tema claro/escuro — regras de implementação

- Implementar via atributo `data-theme="dark" | "light"` na tag `<html>` (ou classe `.dark`/`.light` no Tailwind, `darkMode: 'class'`).
- Persistir a escolha do usuário em `localStorage`/preferência de conta (na plataforma logada) e respeitar `prefers-color-scheme` como padrão inicial.
- **Tema escuro é o padrão** da marca (identidade original), o claro é alternativa — nunca o contrário.
- Todo componente (botões, cards, inputs, badges, gráficos, tabelas) deve consumir os tokens acima — nunca hex fixo no componente.
- O switch de tema deve existir tanto na landing page (header) quanto dentro da plataforma (configurações + atalho no topo).
- Testar contraste mínimo AA em ambos os temas, especialmente `--text-secondary` sobre `--surface`.

---

## 5. Componentes

### Botões
- **Primário:** fundo `--accent` (#FFA500), texto `--text-on-accent` (#1A1A1A), cantos arredondados (~12–16px), peso SemiBold/Bold. Hover: `--accent-hover` (#CC8400).
- **Secundário:** fundo transparente, borda `--border`, texto `--text-primary`.

### Cards
- Cor de fundo: `--surface`
- Borda: 1px `--border`
- Raio: 20px
- Sem sombras pesadas — usar no máximo um glow leve em cards de destaque (ex.: plano recomendado, badge "mais popular" em `--accent-light`)

### Ícones
- Outline 2px, cantos arredondados, geométricos, minimalistas — cor `--text-primary` por padrão, `--accent` quando ativo/destacado

### Ilustrações / mascote
- Vetoriais, monocromáticas (branco no tema escuro / preto suave no tema claro), formas arredondadas, poucos detalhes
- Símbolo: cachorro estilizado, preenchimento sólido, sem contorno/sombra/gradiente/3D, óculos escuros como elemento marcante, alto contraste
- Manter o logo em versão neutra (preto/branco) — não recolorir o mascote de laranja; o laranja fica reservado para CTAs e destaques de UI

### Fotografias (se usadas)
- Alto contraste, pessoas reais, ambiente moderno, luz suave, tom premium (ex.: cliente sendo atendido em barbearia/salão/esmalteria)

### Estilo gráfico geral
- Muito espaço em branco, poucos elementos por seção, hierarquia tipográfica forte, cartões discretos, transparências leves, glow extremamente sutil

---

## 6. Referências estruturais de landing page

1. **Hero** — headline com destaque em `--accent`, subtítulo curto, prova de capacidades, 2 CTAs e mockup do produto. Texto e mockup ocupam colunas independentes no desktop; abaixo de 1080 px empilham com no mínimo 44 px entre as badges e o mockup. Não usar margens negativas nem crop ampliado no mobile.
2. **Faixa de dores/benefícios** — "sem Marc" vs "com Marc"
3. **Grid completo de funcionalidades** — todas as funcionalidades da plataforma, organizadas por card (ver seção 8)
4. **Seções de destaque com mockup** — 2 a 3 blocos alternando texto/imagem para os diferenciais mais fortes (WhatsApp, financeiro, hub de descoberta)
5. **Números/estatísticas**
6. **Pricing** — 3 cards, plano do meio destacado, funcionalidades marcadas por plano
7. **Depoimentos**
8. **FAQ**
9. **CTA final** — gradiente oficial
10. **Footer**

---

## 7. Tom de voz

Direto, confiante, sem jargão técnico. Fala com donos de barbearia, salão e esmalteria — foco em tempo economizado, menos faltas, mais organização e profissionalismo. Frases curtas, orientadas a benefício concreto (dinheiro, tempo, clientes), nunca genéricas.

---

## 8. Funcionalidades e diferenciais (referência mestra)

Usada tanto pela landing page (para evidenciar todos os recursos) quanto pelo plano de implementação.

| Funcionalidade | Diferencial | Plano mínimo |
|---|---|---|
| Agendamento online 24h | Cliente marca sozinho pelo link, sem depender de horário comercial | Starter |
| Lembretes automáticos no WhatsApp | Principal redutor de faltas (no-show) | Starter |
| Confirmação automática de agendamento | Cliente confirma com 1 clique, sem ligação manual | Starter |
| Cadastro de serviços e preços | Duração e valor definidos, agenda calcula sozinha | Starter |
| Página de agendamento personalizada (link próprio) | Profissionaliza a marca do estabelecimento (bio do Instagram, Google Meu Negócio) | Starter |
| Histórico de clientes | Identifica clientes sumidos e permite reengajar | Starter |
| Gestão financeira básica (caixa diário) | Entradas e saídas do dia, faturamento em tempo real | Starter |
| Agenda individual por profissional | Evita choque de horários no time | Pro |
| Bloqueio de horários e folgas | Profissional controla disponibilidade sem recusar manualmente | Pro |
| Controle de comissão por profissional | Cálculo automático, sem planilha paralela | Pro |
| Relatórios e dashboard de faturamento | Visão consolidada por profissional e serviço | Pro |
| Lista de espera / reagendamento automático | Cancelamento vira oportunidade automática, agenda nunca fica vazia | Pro |
| Notificação de aniversário do cliente | Fidelização automática | Pro |
| Múltiplos usuários com permissões (admin/recepção/profissional) | Cada pessoa vê só o que precisa | Pro |
| Multi-unidades | Gerencia toda a rede em uma conta só | Max |
| Cobrança online / sinal antecipado | Elimina falta de vez, garante caixa antecipado | Max |
| Programa de fidelidade / cashback | Incentiva retorno e aumenta recorrência | Max |
| Controle de estoque de produtos | Nunca fica sem pomada, tinta ou insumo no meio do atendimento | Max |
| Exportação de relatórios (PDF/Excel) | Facilita repasse ao contador | Max |
| Integração com Google Calendar | Sincroniza agenda pessoal do profissional | Max |
| Suporte prioritário / onboarding assistido | Atendimento humano na configuração e treinamento | Max |
| **Hub de descoberta Marc** (marketplace entre estabelecimentos) | Se o cliente não encontra vaga no seu lugar favorito, o Marc sugere outro estabelecimento parceiro próximo — o negócio ganha novos clientes que já estão dentro do ecossistema Marc | Todos os planos (recurso da plataforma, não do estabelecimento) |

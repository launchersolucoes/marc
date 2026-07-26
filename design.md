# Design System — Marc

Sistema de agendamentos inteligente para barbearias e salões.
Mascote: cachorro estilizado de óculos escuros, minimalista, geométrico, amigável.

---

## 1. Conceito da marca

Marc transmite **organização, simplicidade, tecnologia e personalidade**.
Palavras-chave: minimalista, premium, inteligente, tecnológico, moderno, confiável, organizado, amigável.

A sensação final deve ser de um produto que **"simplesmente funciona"** — sem excesso visual, com foco absoluto em clareza e experiência do usuário. Referências de estilo: Apple, Linear, Raycast, Vercel, Arc Browser, Notion Calendar.

---

## 2. Paleta de cores

| Token | Hex / valor | Uso |
|---|---|---|
| `--bg-primary` | `#07090D` | Fundo principal (preto profundo) |
| `--bg-secondary` | `#111418` | Fundo secundário / seções |
| `--surface` | `#181C20` | Cards, superfícies elevadas |
| `--border` | `#23272F` | Bordas de cards e inputs |
| `--text-primary` | `#FFFFFF` | Títulos, texto principal |
| `--text-secondary` | `#B4BBC5` | Subtítulos, texto de apoio |
| `--accent` | `#39F29A` | CTAs, ícones ativos, destaques |
| `--accent-hover` | `#2DE287` | Hover / estados ativos |
| `--glow` | `rgba(57,242,154,0.45)` | Glow sutil atrás de elementos-chave |

### Gradiente oficial (fundo de hero/seções de destaque)

```css
background:
  radial-gradient(circle at 95% 8%, #39F29A 0%, #27C97D 18%, rgba(39,201,125,.18) 35%, transparent 60%),
  radial-gradient(circle at 5% 95%, #101B42 0%, rgba(16,27,66,.55) 30%, transparent 60%),
  linear-gradient(135deg, #07090D 0%, #101215 45%, #181C20 100%);
```

Usar em background do hero e, opcionalmente, do rodapé/seção final de CTA. Manter sutil — o glow não deve competir com o texto.

---

## 3. Tipografia

- **Fonte principal:** Instrument Sans
- **Pesos:** Medium (500), SemiBold (600), Bold (700)
- **Tracking:** -8% (aproxima as letras, efeito mais premium) — aplicar em títulos grandes
- **Hierarquia:** títulos grandes e ousados, muito espaço em branco entre blocos, contraste forte entre H1/H2 e corpo de texto (`--text-secondary`)

---

## 4. Componentes

### Botões
- **Primário:** fundo `--accent` (#39F29A), texto `--bg-primary` (#07090D), cantos arredondados (~12–16px), peso SemiBold/Bold
- **Secundário:** fundo transparente, borda `--border`, texto branco

### Cards
- Cor de fundo: `--surface` (#111418)
- Borda: 1px `--border` (#23272F)
- Raio: 20px
- Sem sombras pesadas — usar no máximo um glow leve em cards de destaque (ex.: plano recomendado)

### Ícones
- Outline 2px, cantos arredondados, geométricos, minimalistas — nunca ícones cheios/pesados fora do símbolo do mascote

### Ilustrações / mascote
- Vetoriais, monocromáticas (branco sobre fundo escuro), formas arredondadas, poucos detalhes
- Símbolo: cachorro estilizado, preenchimento sólido branco, sem contorno/sombra/gradiente/3D, óculos escuros como elemento marcante, alto contraste

### Fotografias (se usadas)
- Fundo escuro, alto contraste, pessoas reais, ambiente moderno, luz suave, tom premium (ex.: cliente sendo atendido em barbearia/salão)

### Estilo gráfico geral
- Muito espaço em branco, poucos elementos por seção, hierarquia tipográfica forte, cartões discretos, transparências leves, glow extremamente sutil

---

## 5. Referências estruturais de landing page

Baseado nas referências visuais enviadas (dashboards fintech/dark SaaS):

1. **Hero** — headline grande em 2–3 linhas com uma palavra em destaque na cor de acento, subtítulo curto, prova social (avatares + número, ex. "+2.400 barbearias e salões"), 2 CTAs (primário "Começar agora" + secundário "Ver demonstração"), mockup do produto (celular/dashboard) flutuando à direita com leve glow
2. **Faixa de dores/benefícios** — bloco curto contrastando "sem Marc" vs "com Marc"
3. **Grid de funcionalidades** — 6 cards pequenos com ícone + título + descrição curta (ex.: agendamento online, lembretes via WhatsApp, gestão financeira, agenda por profissional, controle de comissões, relatórios)
4. **Seção de destaque com mockup** — texto à esquerda / imagem de produto à direita (ou alternado), reforçando um diferencial forte (ex.: lembretes automáticos no WhatsApp reduzindo faltas)
5. **Números/estatísticas** — 2–4 métricas grandes (ex. redução de faltas, tempo economizado)
6. **Pricing** — 3 cards lado a lado, plano do meio destacado com fundo `--accent` (padrão visto nas referências), lista de benefícios com check verde, CTA em cada card
7. **Depoimentos** — cards com foto/avatar, nome, estabelecimento, estrelas
8. **CTA final** — bloco com gradiente oficial, headline curta, botão primário grande
9. **Footer** — logo, links, redes sociais, copyright

---

## 6. Tom de voz

Direto, confiante, sem jargão técnico. Fala com donos de barbearia e salão — foco em tempo economizado, menos faltas, mais organização e profissionalismo. Frases curtas, orientadas a benefício concreto (dinheiro, tempo, clientes), nunca genéricas.

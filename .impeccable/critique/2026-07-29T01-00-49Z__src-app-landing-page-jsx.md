---
target: landing page Marc
total_score: 23
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 3
timestamp: 2026-07-29T01-00-49Z
slug: src-app-landing-page-jsx
---
# Impeccable Critique — Marc Landing Page

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 3 | Toggle, menu and form success give feedback; no active navigation or inline validation. |
| 2 | Match System / Real World | 4 | Copy speaks directly about appointments, absences, commissions, cash flow and WhatsApp. |
| 3 | User Control and Freedom | 3 | Anchor navigation and form return are clear; expanded mobile menu keeps the wrong accessible label. |
| 4 | Consistency and Standards | 4 | Tokens, type, buttons, icons and section patterns form a cohesive system. |
| 5 | Error Prevention | 1 | WhatsApp field accepts nearly any text and lacks pattern, length and contextual validation. |
| 6 | Recognition Rather Than Recall | 4 | Features, plans and FAQs remain visible and labeled. |
| 7 | Flexibility and Efficiency | n/a | Not material to this Persuade landing surface. |
| 8 | Aesthetic and Minimalist Design | 2 | Strong hierarchy, but 21 expanded features plus statistics, pricing and testimonials create fatigue. |
| 9 | Error Recovery | 2 | Native required validation exists, but errors are not specific or actionable. |
| 10 | Help and Documentation | n/a | FAQ is sufficient for this marketing surface. |
| **Total** |  | **23/32** | **Good (72%)** |

## Design Specificity Verdict

The landing is moderately specific but still carries strong premium-SaaS template DNA. Marc is convincing in the sector copy, the product mockups, the notebook/WhatsApp/spreadsheet contrast and especially the discovery Hub. However, without the logo, mockups and sector nouns, the dark mode, orange glow, large headline, feature lists and pricing cards could sell many unrelated B2B products.

The detector returned zero findings for `src/app/landing-page.jsx`. Manual source review found issues outside its rule set: trust mismatch, excessive disclosure, light-theme contrast, touch targets and form semantics. No browser overlay or reliable rendered inspection was available because both independent assessments found no Browser backend.

## Overall Impression

The page explains the product quickly and builds a coherent story from operational pain to relief. WhatsApp and the Hub are the most memorable moments. The largest opportunity is to make the conversion honest and singular: today the page visually promises trial and subscription, but operationally offers only a non-persistent demonstration form.

## What's Working

- The value proposition is understandable within seconds and uses real sector language rather than generic productivity claims.
- The narrative structure pain → solution → product → differentiators → price → objections is clear, with WhatsApp and Hub as strong peaks.
- The system is disciplined: consistent tokens and components, semantic landmarks, visible focus, reduced-motion support, persisted theme and responsive breakpoints.

## Priority Issues

### [P1] The promised action and the actual action do not match

**Why it matters:** “Começar agora — 7 dias grátis” and “Assinar” both lead to a form that explicitly creates no account, sends no data and stores nothing. A first-time or skeptical visitor reads this as bait-and-switch.

**Fix:** Choose the one real conversion available now and name it consistently: “Solicitar demonstração” or “Entrar na lista”. Reserve trial and subscription language until those flows exist.

**Suggested command:** `$impeccable clarify`

### [P1] Illustrative social proof weakens trust

**Why it matters:** Named people, businesses, portraits, five stars and precise metrics use the visual grammar of verified evidence, then disclaim that they are illustrative. The disclaimer does not undo the initial impression.

**Fix:** Remove fictional proof or replace it with honest product evidence: a short interactive demo, an absence-cost calculator, a visible setup flow, or process transparency.

**Suggested command:** `$impeccable clarify`

### [P1] Light-theme contrast is not safe

**Why it matters:** Orange `#FFA500` on white is roughly 1.97:1 and appears in small labels and highlighted text. Muted `#747B83` on white is about 4.28:1 and is used at 11–12px. Both undermine legibility in the alternate theme.

**Fix:** Introduce a darker accent-text token for the light theme and darken the muted token; keep the current orange for filled controls and decorative surfaces.

**Suggested command:** `$impeccable colorize`

### [P2] Full disclosure of all 21 features causes fatigue

**Why it matters:** Each maturity block exposes seven items and the mobile version turns them into a long single-column journey before pricing. Completeness becomes an obstacle to persuasion.

**Fix:** Show three or four outcome-led highlights per level, then reveal the complete list on demand. Move the Hub earlier because it is the strongest differentiated idea.

**Suggested command:** `$impeccable distill`

### [P2] The visual language is still category-interchangeable

**Why it matters:** Gradient, glow, floating mockups and pricing cards communicate premium SaaS, but not uniquely Marc. The brand relies on copy to carry product identity.

**Fix:** Build one proprietary visual motif from the real operating rhythm: appointment slots filling, professional chairs/columns, confirmation flow and money recovered from prevented absences.

**Suggested command:** `$impeccable bolder`

## Cognitive Load

**High: 4 of 8 checklist failures.**

- Pass: single focus, grouping, visual hierarchy and working-memory continuity.
- Fail: chunking, one thing at a time, minimal choices and progressive disclosure.
- Decisions above four visible options: desktop header (five links plus theme and CTA), FAQ (five disclosures), and footer (six destinations, partially grouped).
- The three seven-item feature blocks exceed practical scanning limits even when they are not direct choices.

## Emotional Journey

The opening creates relief and ambition. The before/after section deepens the pain without blaming the owner. WhatsApp and Hub form the strongest peak because they connect directly to protected revenue and new demand.

The journey drops after that peak: large statistics are labeled demonstrative, pricing is unconfirmed and testimonials look real before being disclosed as illustrative. The end is honest but weak — a visitor who was invited to start a trial or subscribe discovers that the prototype cannot register a contact. The current peak-end is curiosity followed by operational retreat.

## Persona Red Flags

- **Jordan, first-timer:** understands the product but cannot tell whether the action starts a trial, subscribes, requests contact or merely tests the page.
- **Riley, stress tester:** can submit an invalid WhatsApp value and receive success even though nothing is stored. Claims and proof are not verifiable.
- **Casey, distracted mobile user:** must scroll through 21 features, has no persistent thumb-zone CTA, loses form state after interruption and faces 40×40px header controls.
- **Owner of a barbershop or salon:** recognizes the pain, but still needs migration effort, WhatsApp costs, support conditions, cancellation rules and verified evidence before trusting Marc with daily operations.

## Minor Observations

- Expanded mobile menu should say “Fechar menu” and expose `aria-controls`.
- Mobile theme and menu controls are 40×40px; use at least 44×44px.
- Add `autocomplete` values and `type="tel"` to the form.
- “Sua agenda sempre cheia” is memorable but absolute; a more defensible promise may feel more trustworthy.
- “Até 40% menos faltas” dominates visually before its disclaimer is read.
- The detector returned `[]`; these findings came from design and source review rather than detector rules.

## Questions to Consider

- If every metric and testimonial needs a disclaimer, would product evidence convert better than simulated proof?
- What is the single commercial action a visitor can truly complete today?
- Would Marc remain recognizable without its logo, orange color and name?
- Why does the most defensible differentiator — the Hub — appear only after all 21 features?
- Does a busy owner need the entire roadmap before believing the first outcome: fewer missed appointments?

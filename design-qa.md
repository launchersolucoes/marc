# Design QA — Marc Landing Page

**Comparison target**

- Source direction: `download.jpg`, `Financial Management Website Design for Modern Dashboard.jpg`, `WebDesign.jpg`, `design.md`, and the supplied Marc logo.
- Implementation: local Vite prototype at `http://127.0.0.1:4173/`.
- Desktop comparison viewport: 1440 × 1000 CSS px.
- Mobile verification viewport: 390 × 844 CSS px.
- Density: device scale factor 1.
- The references are structural/art-direction sources rather than a page-specific mock. The hero, dark editorial rhythm, grid texture, acid-green emphasis, product imagery, alternating surfaces, feature cards, pricing emphasis, and typography hierarchy were compared as the required fidelity surfaces.

**Findings**

- No open P0, P1, or P2 findings.
- P3 — The generated dashboard and WhatsApp screens contain small synthetic UI labels that are intentionally treated as illustrative product imagery. They remain crisp and believable at their rendered sizes and do not affect the editable page copy.

**Resolved during QA**

- Replaced the incompatible social icon export with a supported icon from the same outline family.
- Verified that the page has no horizontal overflow at 1440 px or 390 px.
- Optimized testimonial portraits from roughly 2 MB each to approximately 17–20 KB each at their rendered size.
- Confirmed that the optimized portraits load with no broken image resources.

**Required fidelity surfaces**

- Fonts and typography: passed. Instrument Sans is loaded at 500/600/700; display headings use compressed tracking, strong weight, deliberate wrapping, and hierarchy matching the supplied dark SaaS references.
- Spacing and layout rhythm: passed. Desktop uses a 1200 px content frame, generous section spacing, 20 px card radii, low-contrast borders, and alternating surface sections. Mobile stacks all primary regions cleanly with practical tap targets.
- Colors and visual tokens: passed. The implementation maps the supplied `#07090D`, `#111418`, `#181C20`, `#23272F`, `#B4BBC5`, and `#39F29A` tokens directly and uses the official hero/final-CTA gradient.
- Image quality and asset fidelity: passed. The supplied Marc logo is used directly; hero and WhatsApp product visuals were generated as real raster assets in the same premium dark/green art direction; testimonial portraits are real raster assets rather than placeholders or CSS drawings.
- Copy and content: passed. All product copy is in Brazilian Portuguese, focuses on time, revenue, fewer no-shows, and easier operations, and clearly separates illustrative metrics from guarantees.
- Icons: passed. Interface icons come from one consistent 2 px outline library and align with the supplied design specification.
- States and interactions: passed. Fixed header state, mobile menu, smooth anchor navigation, monthly/annual pricing, FAQ disclosure controls, trial modal, required fields, and success confirmation are functional.
- Accessibility: passed. Semantic headings, landmarks, button labels, image alt text, visible keyboard focus, reduced-motion support, responsive text wrapping, and minimum practical mobile tap targets are present.
- Browser health: passed. No console errors or warnings were observed during desktop and mobile checks.

**Implementation checklist**

- [x] Desktop visual comparison
- [x] Mobile breakpoint verification
- [x] Core conversion flow
- [x] Pricing state
- [x] Mobile navigation
- [x] Image loading
- [x] Production build

final result: passed

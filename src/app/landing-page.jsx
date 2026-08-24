"use client";

import Image from "next/image";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState } from "react";
import { AnimatedGradient } from "../components/ui/animated-gradient";
import { commercialPlans } from "../lib/subscription";
import {
  ArrowRight,
  BarChart3,
  BellRing,
  Boxes,
  Building2,
  CalendarCheck2,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Coins,
  FileDown,
  Gift,
  History,
  Link2,
  MapPin,
  Menu,
  MessageCircleMore,
  Moon,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  UserCog,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const essentialFeatures = [
  [CalendarCheck2, "Agendamento online 24h", "Seu cliente marca sozinho, mesmo quando o negócio está fechado."],
  [MessageCircleMore, "Lembretes no WhatsApp", "Confirmações automáticas reduzem faltas e o trabalho manual."],
  [CheckCircle2, "Confirmação automática", "O cliente confirma o horário com um clique, sem ligação."],
  [Clock3, "Serviços e preços", "Duração e valor definidos para a agenda calcular tudo sozinha."],
  [Link2, "Link próprio de agendamento", "Uma página profissional para sua bio, Google e redes sociais."],
  [History, "Histórico de clientes", "Consulte contatos e atendimentos anteriores sem procurar em conversas."],
  [WalletCards, "Caixa mensal", "Atendimentos concluídos viram entradas e as saídas ficam no mesmo lugar."],
];

const teamFeatures = [
  [UsersRound, "Agenda por profissional", "Cada pessoa da equipe com seus horários e serviços organizados."],
  [CalendarClock, "Folgas e bloqueios", "A disponibilidade fica certa antes de o cliente escolher."],
  [Coins, "Comissões automáticas", "Cálculo por serviço e profissional, sem planilhas paralelas."],
  [BarChart3, "Dashboard de faturamento", "Resultado consolidado por profissional, período e serviço."],
  [BellRing, "Lista de espera", "Organize quem aguarda uma vaga e converta a solicitação em atendimento."],
  [Gift, "Aniversário do cliente", "Crie uma lembrança que ajuda a trazer o cliente de volta."],
  [UserCog, "Usuários e permissões", "Administração, recepção e profissionais veem apenas o necessário."],
];

const scaleFeatures = [
  [Building2, "Multi-unidades", "Gerencie todos os endereços da rede em uma única conta."],
  [CircleDollarSign, "Sinal antecipado", "Proteja o horário e garanta parte do caixa antes do atendimento."],
  [Gift, "Fidelidade e cashback", "Recompense recorrência e incentive a próxima visita."],
  [Boxes, "Controle de estoque", "Acompanhe produtos e insumos antes que eles acabem."],
  [FileDown, "Exportação de relatórios", "Leve os números ao contador em PDF ou Excel."],
  [CalendarCheck2, "Google Calendar", "Sincronize a agenda profissional e pessoal sem conflito."],
  [ShieldCheck, "Onboarding assistido", "Apoio humano para configurar a operação e treinar a equipe."],
];

const featureGroups = [
  {
    id: "essencial",
    title: "Essencial",
    note: "Para sair do caderno",
    intro: "Tudo o que um profissional precisa para organizar o dia e receber clientes sem depender de mensagens.",
    features: essentialFeatures,
  },
  {
    id: "time",
    title: "Time",
    note: "Para operar em equipe",
    intro: "Controle de disponibilidade, permissões e resultado para o negócio crescer sem perder a organização.",
    features: teamFeatures,
  },
  {
    id: "escala",
    title: "Escala",
    note: "Para negócios maiores",
    intro: "Recursos para redes, recorrência, estoque e uma operação mais madura.",
    features: scaleFeatures,
  },
];

const plannedFeatures = new Set([
  "Lembretes no WhatsApp",
  "Confirmação automática",
  "Aniversário do cliente",
  ...scaleFeatures.map(([, title]) => title),
]);

const plannedPlanBenefits = new Set([
  "WhatsApp automático",
  "Multi-unidades",
  "Sinal antecipado",
  "Estoque e fidelidade",
  "Onboarding assistido",
]);

const plans = [
  {
    name: "Starter",
    price: commercialPlans.starter.monthlyPriceLabel.replace("R$ ", ""),
    audience: "Para quem atende sozinho",
    limit: "Composição do plano em definição",
    benefits: ["Agendamento online 24h", "WhatsApp automático", "Link próprio", "Caixa diário", "Histórico de clientes"],
  },
  {
    name: "Pro",
    price: commercialPlans.pro.monthlyPriceLabel.replace("R$ ", ""),
    audience: "Para equipes em crescimento",
    limit: "Composição do plano em definição",
    popular: true,
    benefits: ["Tudo do Starter", "Agenda por profissional", "Comissões automáticas", "Relatórios completos", "Usuários e permissões"],
  },
  {
    name: "Max",
    price: commercialPlans.max.monthlyPriceLabel.replace("R$ ", ""),
    audience: "Para operações completas",
    limit: "Composição do plano em definição",
    benefits: ["Tudo do Pro", "Multi-unidades", "Sinal antecipado", "Estoque e fidelidade", "Onboarding assistido"],
  },
];

const productFlow = [
  {
    icon: CalendarCheck2,
    moment: "Cliente",
    title: "Escolhe serviço, profissional e horário",
    text: "O agendamento acontece pelo link do estabelecimento, sem instalar aplicativo.",
  },
  {
    icon: ShieldCheck,
    moment: "Marc",
    title: "Valida disponibilidade e evita conflitos",
    text: "O horário só entra quando respeita a agenda, os bloqueios e a duração configurada.",
  },
  {
    icon: UsersRound,
    moment: "Equipe",
    title: "Atende com a agenda organizada",
    text: "Cada profissional acompanha horários, bloqueios e o status de cada atendimento.",
  },
  {
    icon: BarChart3,
    moment: "Gestão",
    title: "Enxerga caixa e comissões",
    text: "O atendimento concluído alimenta o controle financeiro sem uma planilha paralela.",
  },
];

const gradientThemes = {
  dark: {
    hero: {
      color1: "#1a1a1a",
      color2: "#4a2500",
      color3: "#7a4300",
      rotation: 18,
      proportion: 56,
      scale: 0.56,
      speed: 18,
      distortion: 22,
      swirl: 52,
      swirlIterations: 8,
      softness: 96,
      offset: 0,
      shape: "Checks",
      shapeSize: 38,
    },
    final: {
      color1: "#1a1a1a",
      color2: "#3a2108",
      color3: "#704000",
      rotation: -24,
      proportion: 58,
      scale: 0.52,
      speed: 16,
      distortion: 18,
      swirl: 46,
      swirlIterations: 7,
      softness: 98,
      offset: 320,
      shape: "Stripes",
      shapeSize: 34,
    },
  },
  light: {
    hero: {
      color1: "#f8f9fa",
      color2: "#ffe6ad",
      color3: "#ffc04d",
      rotation: 18,
      proportion: 56,
      scale: 0.56,
      speed: 18,
      distortion: 22,
      swirl: 52,
      swirlIterations: 8,
      softness: 96,
      offset: 0,
      shape: "Checks",
      shapeSize: 38,
    },
    final: {
      color1: "#ffffff",
      color2: "#fff1cf",
      color3: "#ffa500",
      rotation: -24,
      proportion: 58,
      scale: 0.52,
      speed: 16,
      distortion: 18,
      swirl: 46,
      swirlIterations: 7,
      softness: 98,
      offset: 320,
      shape: "Stripes",
      shapeSize: 34,
    },
  },
};

const faqs = [
  ["Preciso instalar alguma coisa?", "Não. O Marc funciona pelo navegador no celular ou computador. A configuração e a gestão acontecem online."],
  ["Meus clientes precisam baixar um aplicativo?", "Não. Eles acessam seu link, escolhem o serviço, o profissional e o horário. Simples assim."],
  ["Como funcionará o lembrete no WhatsApp?", "A automação está em preparação. Quando for liberada, o Marc enviará a mensagem antes do atendimento e levará a resposta para a agenda da equipe."],
  ["O que é o Hub de descoberta Marc?", "É uma evolução planejada para conectar estabelecimentos parceiros. O Hub ainda não faz parte da operação disponível no teste."],
  ["Posso trocar de plano depois?", "Sim. Você pode começar com o plano adequado para hoje e mudar conforme a sua operação crescer."],
];

function Brand() {
  return (
    <a className="brand" href="#inicio" aria-label="Marc, voltar ao início">
      <Image src="/assets/marc-logo-cropped.png" alt="" width={208} height={90} priority />
    </a>
  );
}

function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={onToggle}
      aria-label={`Ativar tema ${theme === "dark" ? "claro" : "escuro"}`}
    >
      <Sun className="theme-toggle__sun" size={17} />
      <Moon className="theme-toggle__moon" size={17} />
    </button>
  );
}

function ButtonLink({ children, href = "/cadastro", variant = "primary", className = "" }) {
  return (
    <a className={`button button--${variant} ${className}`} href={href}>
      {children}
    </a>
  );
}

function SectionHeader({ tag, title, description, align = "left" }) {
  return (
    <header className={`section-heading section-heading--${align}`}>
      <span className="section-tag">{tag}</span>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </header>
  );
}

function FeatureRow({ icon: Icon, title, text, planned = false }) {
  return (
    <article className="feature-row">
      <div className="feature-row__icon"><Icon size={20} strokeWidth={2} /></div>
      <div>
        <h4>{title}{planned && <span className="feature-status">Em preparação</span>}</h4>
        <p>{text}</p>
      </div>
    </article>
  );
}

function FeatureGroup({ group }) {
  const visibleFeatures = group.features.slice(0, 4);
  const additionalFeatures = group.features.slice(4);

  return (
    <section className="feature-group">
      <div className="feature-group__intro">
        <span>{group.note}</span>
        <h3>{group.title}</h3>
        <p>{group.intro}</p>
      </div>
      <div className="feature-group__content">
        <div className="feature-group__list">
          {visibleFeatures.map(([icon, title, text]) => (
            <FeatureRow key={title} icon={icon} title={title} text={text} planned={plannedFeatures.has(title)} />
          ))}
        </div>
        {additionalFeatures.length > 0 && (
          <details className="feature-more">
            <summary>
              Ver mais {additionalFeatures.length} recursos
              <ChevronDown size={18} />
            </summary>
            <div className="feature-group__list feature-group__list--more">
              {additionalFeatures.map(([icon, title, text]) => (
                <FeatureRow key={title} icon={icon} title={title} text={text} planned={plannedFeatures.has(title)} />
              ))}
            </div>
          </details>
        )}
      </div>
    </section>
  );
}

export default function LandingPage() {
  const landingRef = useRef(null);
  const [theme, setTheme] = useState("dark");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme || "dark");
  }, []);

  useGSAP(() => {
    const root = landingRef.current;
    if (!root) return undefined;

    document.documentElement.removeAttribute("data-gsap-ready");
    void root.offsetWidth;

    const media = gsap.matchMedia();
    media.add(
      {
        desktop: "(min-width: 769px)",
      },
      ({ conditions }) => {
        const distance = conditions.desktop ? 34 : 18;
        const select = (selector, scope = root) => Array.from(scope.querySelectorAll(selector));
        const reveal = ({ trigger, targets, from, duration = 0.72, stagger = 0 }) => {
          const triggerElement = typeof trigger === "string" ? root.querySelector(trigger) : trigger;
          const elements = typeof targets === "string" ? select(targets) : Array.from(targets || []);
          if (!triggerElement || !elements.length) return;

          const scrollTrigger = {
            trigger: triggerElement,
            start: "top 86%",
            once: true,
            invalidateOnRefresh: true,
          };
          const shared = {
            autoAlpha: 1,
            x: 0,
            y: 0,
            clipPath: "inset(0% 0% 0% 0%)",
            duration,
            ease: "power3.out",
            force3D: true,
            lazy: false,
            immediateRender: true,
            willChange: "transform,opacity,clip-path",
            clearProps: "transform,opacity,visibility,clipPath,willChange",
            overwrite: "auto",
          };

          if (typeof from === "function") {
            const timeline = gsap.timeline({ scrollTrigger });
            elements.forEach((element, index) => {
              timeline.fromTo(
                element,
                from(index, element),
                shared,
                index * stagger,
              );
            });
          } else {
            gsap.fromTo(elements, from, { ...shared, stagger, scrollTrigger });
          }
        };

        select(".section-heading").forEach((heading) => {
          reveal({
            trigger: heading,
            targets: [heading],
            from: { autoAlpha: 0, y: distance * 0.7, clipPath: "inset(0 0 24% 0)" },
          });
        });

        reveal({
          trigger: ".contrast-grid",
          targets: select(".contrast-panel"),
          from: (index) => ({ autoAlpha: 0, x: index === 0 ? -distance : distance }),
          stagger: 0.1,
          duration: 0.78,
        });

        const hubMap = root.querySelector(".hub-map");
        const hubCopy = root.querySelector(".hub-grid .spotlight-copy");
        reveal({
          trigger: ".hub-grid",
          targets: [hubMap, hubCopy].filter(Boolean),
          from: (index) => ({
            autoAlpha: 0,
            x: index === 0 ? -distance : distance,
            clipPath: index === 0 ? "inset(4% 8% 4% 0 round 16px)" : "inset(0 0 12% 0)",
          }),
          stagger: 0.12,
          duration: 0.82,
        });

        select(".feature-group").forEach((group) => {
          const intro = group.querySelector(".feature-group__intro");
          const rows = select(".feature-group__content > .feature-group__list .feature-row", group);
          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger: group,
              start: "top 84%",
              once: true,
              invalidateOnRefresh: true,
            },
            defaults: {
              ease: "power3.out",
              force3D: true,
              lazy: false,
              immediateRender: true,
              clearProps: "transform,opacity,visibility,willChange",
            },
          });
          if (intro) {
            timeline.fromTo(
              intro,
              { autoAlpha: 0, x: -distance * 0.7 },
              {
                autoAlpha: 1,
                x: 0,
                duration: 0.64,
                willChange: "transform,opacity",
              },
            );
          }
          if (rows.length) {
            timeline.fromTo(
              rows,
              { autoAlpha: 0, y: distance * 0.55 },
              {
                autoAlpha: 1,
                y: 0,
                duration: 0.54,
                stagger: 0.07,
                willChange: "transform,opacity",
              },
              intro ? "-=0.38" : 0,
            );
          }
        });

        const whatsappCopy = root.querySelector(".whatsapp-section .spotlight-copy");
        const phoneStage = root.querySelector(".phone-stage");
        reveal({
          trigger: ".whatsapp-section .spotlight-grid",
          targets: [whatsappCopy, phoneStage].filter(Boolean),
          from: (index) => ({ autoAlpha: 0, x: index === 0 ? -distance : distance }),
          stagger: 0.12,
          duration: 0.8,
        });

        reveal({
          trigger: ".product-demo__header",
          targets: select(".product-demo__header > *"),
          from: { autoAlpha: 0, y: distance * 0.55, clipPath: "inset(0 0 18% 0)" },
          stagger: 0.07,
          duration: 0.62,
        });
        reveal({
          trigger: ".product-demo__gallery",
          targets: select(".product-capture"),
          from: (index) => ({
            autoAlpha: 0,
            x: index === 0 ? -distance : distance,
            clipPath: "inset(3% 3% 3% 3% round 16px)",
          }),
          stagger: 0.1,
          duration: 0.78,
        });
        reveal({
          trigger: ".product-flow",
          targets: select(".product-flow__step"),
          from: { autoAlpha: 0, y: distance * 0.7 },
          stagger: 0.11,
          duration: 0.64,
        });

        reveal({
          trigger: ".pricing-grid",
          targets: select(".price-card"),
          from: { autoAlpha: 0, y: distance * 0.65, clipPath: "inset(7% 0 0 0 round 16px)" },
          stagger: 0.1,
          duration: 0.7,
        });

        reveal({
          trigger: ".evidence-grid",
          targets: select(".evidence-item"),
          from: { autoAlpha: 0, y: distance * 0.45 },
          stagger: 0.08,
          duration: 0.58,
        });

        reveal({
          trigger: ".final-cta__grid",
          targets: select(".final-cta__grid > *"),
          from: (index) => ({ autoAlpha: 0, x: index === 0 ? -distance : distance }),
          stagger: 0.12,
          duration: 0.8,
        });

        const refreshFrame = window.requestAnimationFrame(() => ScrollTrigger.refresh());
        return () => window.cancelAnimationFrame(refreshFrame);
      },
    );

    return () => media.revert();
  }, { scope: landingRef });

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("marc-theme", nextTheme);
    setTheme(nextTheme);
  }

  return (
    <div className="site-shell" ref={landingRef}>
      <header className="site-header">
        <div className="container site-header__inner">
          <Brand />
          <nav id="site-navigation" className={`site-nav ${menuOpen ? "site-nav--open" : ""}`} aria-label="Navegação principal">
            <a href="#hub" onClick={() => setMenuOpen(false)}>Hub Marc</a>
            <a href="#funcionalidades" onClick={() => setMenuOpen(false)}>Funcionalidades</a>
            <a href="#demonstracao" onClick={() => setMenuOpen(false)}>Demonstração</a>
            <a href="#planos" onClick={() => setMenuOpen(false)}>Planos</a>
            <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
          </nav>
          <div className="site-header__actions">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <ButtonLink className="header-cta">Reservar teste <ArrowRight size={16} /></ButtonLink>
            <button
              className="menu-toggle"
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="site-navigation"
              aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            >
              {menuOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero" id="inicio">
          <AnimatedGradient className="page-gradient" config={gradientThemes[theme].hero} />
          <div className="container hero__inner">
            <div className="hero__copy">
              <div className="hero__eyebrow"><Sparkles size={15} /> Gestão feita para quem atende pessoas</div>
              <h1>Sua agenda trabalha. <em>Você atende.</em></h1>
              <p className="hero__lead">
                Agenda, clientes, equipe, serviços e financeiro conectados para sua barbearia, salão ou esmalteria funcionar sem controles espalhados.
              </p>
              <div className="hero__actions">
                <ButtonLink>Começar teste grátis de 14 dias <ArrowRight size={17} /></ButtonLink>
                <ButtonLink href="#como-funciona" variant="secondary">Ver como funciona</ButtonLink>
              </div>
              <div className="hero__proof">
                <span><CalendarCheck2 size={16} /> Agenda e lista de espera</span>
                <span><UsersRound size={16} /> Equipe e permissões</span>
                <span><WalletCards size={16} /> Caixa e comissões</span>
              </div>
            </div>

            <div className="hero__visual hero__visual--product" aria-label="Tela real do painel Marc com dados demonstrativos">
              <div className="hero__visual-glow" />
              <Image
                src="/assets/marc-product-overview.png"
                alt="Visão geral do Marc com resumo da operação, agenda e atalhos"
                width={1265}
                height={712}
                unoptimized
                priority
              />
              <div className="floating-note floating-note--top">
                <span><Check size={14} /></span>
                <div><strong>Agenda sem conflito</strong><small>Disponibilidade e bloqueios validados</small></div>
              </div>
              <div className="floating-note floating-note--bottom">
                <span><BarChart3 size={14} /></span>
                <div><strong>Resultado conectado</strong><small>Caixa, comissões e relatórios</small></div>
              </div>
            </div>
          </div>
        </section>

        <section className="contrast-section" id="como-funciona">
          <div className="container">
            <SectionHeader
              tag="Antes e depois"
              title="O problema não é falta de esforço. É excesso de trabalho manual."
              description="Enquanto a operação fica espalhada entre caderno, WhatsApp e planilhas, dinheiro e tempo escapam pelos detalhes."
            />
            <div className="contrast-grid">
              <article className="contrast-panel contrast-panel--problem">
                <span className="contrast-panel__label">Sem o Marc</span>
                <h3>Todo dia começa apagando incêndio.</h3>
                <ul>
                  <li><X size={17} /> Clientes esquecem e faltam sem avisar</li>
                  <li><X size={17} /> Horários se chocam em conversas diferentes</li>
                  <li><X size={17} /> Caixa e comissões dependem de planilhas</li>
                  <li><X size={17} /> A equipe confirma cada cliente manualmente</li>
                  <li><X size={17} /> O cliente só marca quando alguém responde</li>
                </ul>
              </article>
              <article className="contrast-panel contrast-panel--solution">
                <span className="contrast-panel__label">Com o Marc</span>
                <h3>A operação trabalha junto com você.</h3>
                <ul>
                  <li><Check size={17} /> A equipe acompanha cada status na agenda</li>
                  <li><Check size={17} /> Cada profissional tem sua agenda certa</li>
                  <li><Check size={17} /> Faturamento e comissões ficam visíveis</li>
                  <li><Check size={17} /> O cliente agenda a qualquer hora</li>
                  <li><Check size={17} /> Você decide com números, não com memória</li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section className="section hub-section" id="hub">
          <div className="container hub-grid">
            <div className="hub-map" aria-hidden="true">
              <div className="hub-map__ring hub-map__ring--one" />
              <div className="hub-map__ring hub-map__ring--two" />
              <div className="hub-map__center"><Image src="/assets/marc-logo-cropped.png" alt="" width={110} height={48} /></div>
              <div className="hub-place hub-place--one"><MapPin size={18} /><span>Barbearia</span></div>
              <div className="hub-place hub-place--two"><MapPin size={18} /><span>Salão</span></div>
              <div className="hub-place hub-place--three"><MapPin size={18} /><span>Esmalteria</span></div>
              <div className="hub-search"><Search size={17} /> Próximo horário disponível</div>
            </div>
            <div className="spotlight-copy">
              <span className="section-tag">Evolução planejada</span>
              <h2>No futuro, uma vaga próxima poderá virar um novo cliente.</h2>
              <p>
                O Hub Marc está planejado para sugerir estabelecimentos parceiros quando o cliente não encontrar vaga no lugar favorito. Esta experiência ainda não faz parte do teste atual.
              </p>
              <ul className="check-list">
                <li><Check size={17} /> Descoberta por proximidade e disponibilidade</li>
                <li><Check size={17} /> Visibilidade entre estabelecimentos parceiros</li>
                <li><Check size={17} /> Recurso separado da operação já disponível</li>
              </ul>
              <ButtonLink href="#demonstracao">Ver o fluxo completo <ArrowRight size={17} /></ButtonLink>
            </div>
          </div>
        </section>

        <section className="section features-section" id="funcionalidades">
          <div className="container">
            <SectionHeader
              tag="Produto completo"
              title="Comece pelo essencial. Cresça sem trocar de sistema."
              description="Veja o que já funciona no teste e o que está marcado como próxima evolução da plataforma."
            />
            <div className="feature-groups">
              {featureGroups.map((group) => <FeatureGroup key={group.id} group={group} />)}
            </div>
          </div>
        </section>

        <section className="section whatsapp-section">
          <div className="container spotlight-grid">
            <div className="spotlight-copy">
              <span className="section-tag">Automação em preparação</span>
              <h2>Um lembrete enviado. Um horário protegido.</h2>
              <p>
                Cada falta abre um buraco na agenda. Esta demonstração mostra como o Marc conectará lembrete, confirmação e equipe quando a automação for liberada.
              </p>
              <ul className="check-list">
                <li><Check size={17} /> Mensagem antes do atendimento</li>
                <li><Check size={17} /> Confirmação em um clique</li>
                <li><Check size={17} /> Menos tempo cobrando respostas</li>
              </ul>
              <div className="impact-callout">
                <strong>Prévia do fluxo planejado.</strong>
                <span>A página de agendamento já funciona; o envio automático pelo WhatsApp será ativado em uma fase posterior.</span>
              </div>
            </div>
            <div className="phone-stage">
              <Image src="/assets/marc-whatsapp-reminder.png" alt="Exemplo de lembrete automático no WhatsApp" width={1024} height={1024} />
              <div className="message-status"><CheckCircle2 size={16} /> Confirmação recebida</div>
            </div>
          </div>
        </section>

        <section className="product-demo" id="demonstracao" aria-labelledby="product-demo-title">
          <div className="container">
            <div className="product-demo__header">
              <span className="section-tag">Produto em funcionamento</span>
              <h2 id="product-demo-title">O que você vê aqui já existe no Marc.</h2>
              <p>Telas reais do estabelecimento piloto, usando dados demonstrativos para mostrar a operação completa.</p>
            </div>
            <div className="product-demo__gallery" aria-label="Telas reais do produto">
              <figure className="product-capture product-capture--agenda">
                <figcaption><span>Agenda interna</span><small>Equipe, horários e novo atendimento</small></figcaption>
                <Image src="/assets/marc-product-agenda.png" alt="Agenda interna do Marc com profissionais, horários e formulário de atendimento" width={1265} height={712} unoptimized />
              </figure>
              <figure className="product-capture product-capture--booking">
                <figcaption><span>Agendamento público</span><small>Sem aplicativo para o cliente</small></figcaption>
                <Image src="/assets/marc-product-booking-mobile.png" alt="Página pública de agendamento do Marc em um celular" width={366} height={712} unoptimized />
              </figure>
            </div>
            <div className="product-flow">
              {productFlow.map(({ icon: Icon, moment, title, text }, index) => (
                <article className="product-flow__step" key={title}>
                  <div className="product-flow__marker">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <Icon size={20} />
                  </div>
                  <div>
                    <small>{moment}</small>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section pricing-section" id="planos">
          <div className="container">
            <SectionHeader
              tag="Planos de lançamento"
              title="Escolha o tamanho da sua operação. Não o limite do seu crescimento."
              description="Teste o Marc grátis por 14 dias, sem cartão de crédito. Depois, escolha o plano que combina com o tamanho da sua operação."
              align="center"
            />
            <div className="pricing-grid">
              {plans.map((plan) => (
                <article className={`price-card ${plan.popular ? "price-card--popular" : ""}`} key={plan.name}>
                  {plan.popular && <span className="popular-badge">Mais popular</span>}
                  <div className="price-card__head">
                    <span>{plan.audience}</span>
                    <h3>{plan.name}</h3>
                    <div className="price"><small>R$</small><strong>{plan.price}</strong><span>/mês</span></div>
                    <p>{plan.limit}</p>
                  </div>
                  <ul>
                    {plan.benefits.map((benefit) => <li key={benefit}><Check size={17} /> <span>{benefit}{plannedPlanBenefits.has(benefit) && <small>Em preparação</small>}</span></li>)}
                  </ul>
                  <ButtonLink variant={plan.popular ? "dark" : "secondary"}>Reservar teste {plan.name} <ArrowRight size={16} /></ButtonLink>
                </article>
              ))}
            </div>
            <p className="pricing-note">Todos os planos incluem 14 dias grátis. A cobrança só começa após a contratação; os limites de profissionais ainda podem ser ajustados antes do lançamento comercial.</p>
          </div>
        </section>

        <section className="section evidence-section">
          <div className="container">
            <SectionHeader
              tag="Operação conectada"
              title="O atendimento termina. A gestão já está atualizada."
              description="As capacidades abaixo já estão disponíveis no teste gratuito, com dados persistidos e permissões por perfil."
            />
            <div className="evidence-grid">
              <article className="evidence-item">
                <CalendarCheck2 size={24} />
                <span>Agenda protegida</span>
                <h3>Disponibilidade, bloqueios e conflitos são validados antes de confirmar o horário.</h3>
              </article>
              <article className="evidence-item">
                <UsersRound size={24} />
                <span>Acesso por função</span>
                <h3>Gerência e recepção operam a equipe; cada profissional acompanha a própria agenda.</h3>
              </article>
              <article className="evidence-item">
                <CircleDollarSign size={24} />
                <span>Financeiro conectado</span>
                <h3>O atendimento concluído gera entrada, comissão e dados para os relatórios.</h3>
              </article>
            </div>
          </div>
        </section>

        <section className="section faq-section" id="faq">
          <div className="container faq-grid">
            <SectionHeader
              tag="Dúvidas frequentes"
              title="Antes de começar, tire o peso da decisão."
              description="O Marc foi pensado para simplificar a operação desde o primeiro acesso."
            />
            <div className="faq-list">
              {faqs.map(([question, answer], index) => (
                <details key={question} open={index === 0}>
                  <summary>{question}<ChevronDown size={19} /></summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="final-cta" id="cadastro">
          <AnimatedGradient className="page-gradient" config={gradientThemes[theme].final} />
          <div className="container final-cta__grid">
            <div>
              <span className="section-tag">Comece com calma</span>
              <h2>Troque o improviso por uma operação que simplesmente funciona.</h2>
              <p>Comece com 14 dias grátis para configurar o negócio, organizar a agenda e testar a operação antes de escolher uma assinatura.</p>
            </div>
            <div className="signup-panel signup-panel--access">
              <span className="signup-panel__eyebrow"><ShieldCheck size={15} /> Teste grátis de 14 dias</span>
              <h3>Crie sua conta e monte a base do seu negócio.</h3>
              <p>Em poucos minutos, você configura o estabelecimento e abre o primeiro painel do Marc.</p>
              <ul>
                <li><Check size={16} /> Sem cartão para começar</li>
                <li><Check size={16} /> Acesso seguro por e-mail e senha</li>
                <li><Check size={16} /> Configuração guiada do estabelecimento</li>
              </ul>
              <ButtonLink>Criar minha conta <ArrowRight size={17} /></ButtonLink>
              <Link className="signup-panel__login" href="/entrar">Já tenho uma conta</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer__top">
          <div className="footer__brand">
            <Brand />
            <p>A agenda inteligente para barbearias, salões, esmalterias e profissionais de beleza.</p>
          </div>
          <div className="footer__links">
            <div><strong>Produto</strong><a href="#como-funciona">Como funciona</a><a href="#demonstracao">Demonstração</a><a href="#funcionalidades">Funcionalidades</a></div>
            <div><strong>Informações</strong><a href="#hub">Hub Marc</a><a href="#faq">Dúvidas</a><Link href="/privacidade">Privacidade</Link><Link href="/termos">Termos de Uso</Link></div>
          </div>
        </div>
        <div className="container footer__bottom">
          <span>© 2026 Marc. Todos os direitos reservados.</span>
          <span>Feito para quem cuida de pessoas.</span>
        </div>
      </footer>
    </div>
  );
}

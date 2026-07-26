import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CalendarCheck2,
  Check,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Link2,
  Menu,
  MessageCircleMore,
  Scissors,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";

const workflow = [
  {
    icon: Settings2,
    label: "Prepare uma vez",
    title: "Configure sua rotina",
    text: "Cadastre serviços, profissionais e horários sem desmontar a agenda do dia seguinte.",
  },
  {
    icon: Link2,
    label: "Compartilhe seu link",
    title: "O cliente escolhe",
    text: "Ele seleciona serviço, profissional e horário pelo navegador, sem instalar aplicativo.",
  },
  {
    icon: MessageCircleMore,
    label: "O Marc acompanha",
    title: "Confirme no WhatsApp",
    text: "O lembrete sai automaticamente antes do atendimento e reduz o trabalho de confirmação.",
  },
  {
    icon: BarChart3,
    label: "Tudo se conecta",
    title: "Feche o dia com clareza",
    text: "Agenda, atendimento, faturamento e comissões ficam reunidos na mesma operação.",
  },
];

const capabilityGroups = [
  {
    title: "Agenda e relacionamento",
    description: "Do primeiro clique do cliente ao horário confirmado.",
    items: [
      {
        icon: CalendarCheck2,
        title: "Agendamento online 24h",
        text: "Seu cliente marca quando quiser, sem ligação ou conversa demorada.",
      },
      {
        icon: MessageCircleMore,
        title: "Lembretes no WhatsApp",
        text: "Confirmações automáticas ajudam a proteger horários e reduzir retrabalho.",
      },
      {
        icon: UserRoundCheck,
        title: "Histórico de clientes",
        text: "Preferências, frequência e atendimentos anteriores ficam fáceis de consultar.",
      },
    ],
  },
  {
    title: "Equipe e resultado",
    description: "A visão que o responsável precisa para conduzir o negócio.",
    items: [
      {
        icon: UsersRound,
        title: "Agenda por profissional",
        text: "Cada pessoa da equipe trabalha com serviços, horários e disponibilidade organizados.",
      },
      {
        icon: WalletCards,
        title: "Financeiro integrado",
        text: "Entradas, saídas e faturamento saem das planilhas e entram no fluxo da operação.",
      },
      {
        icon: CircleDollarSign,
        title: "Comissões automáticas",
        text: "O Marc calcula comissões por profissional e serviço, sem conta no fim do dia.",
      },
    ],
  },
];

const plans = [
  {
    name: "Starter",
    note: "Para uma rotina individual",
    status: "Condição em definição",
    items: ["1 profissional", "Agenda online", "Lembretes no WhatsApp", "Controle financeiro"],
  },
  {
    name: "Pro",
    note: "Para equipes em crescimento",
    status: "Condição em definição",
    popular: true,
    items: ["Até 5 profissionais", "Tudo do Starter", "Comissões automáticas", "Relatórios da operação"],
  },
  {
    name: "Max",
    note: "Para operações maiores",
    status: "Condição em definição",
    items: ["Até 15 profissionais", "Tudo do Pro", "Visão ampliada da equipe", "Suporte de implantação"],
  },
];

const scenarios = [
  {
    image: "/assets/avatar-rafael.jpg",
    role: "Gestor de barbearia",
    text: "A equipe abre a agenda e entende o dia sem depender de mensagens espalhadas.",
  },
  {
    image: "/assets/avatar-camila.jpg",
    role: "Profissional autônoma",
    text: "O link de agendamento reduz as conversas fora do horário e devolve tempo para atender.",
  },
  {
    image: "/assets/avatar-andre.jpg",
    role: "Responsável por uma equipe",
    text: "Horários, caixa e comissões passam a fazer parte da mesma rotina de trabalho.",
  },
];

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function Brand({ compact = false }) {
  return (
    <a className={`brand ${compact ? "brand--compact" : ""}`} href="#inicio" aria-label="Marc — início">
      <img src="/assets/marc-logo-cropped.webp" alt="Marc" width="785" height="265" />
    </a>
  );
}

function DemoButton({ children, className = "", onClick }) {
  return (
    <button className={`button button--primary ${className}`} type="button" onClick={onClick}>
      {children}
      <ArrowRight size={18} />
    </button>
  );
}

export function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  const menuButtonRef = useRef(null);
  const phoneRef = useRef(null);
  const returnFocusRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    if (!demoOpen) return undefined;

    document.body.style.overflow = "hidden";
    const focusTimer = window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setDemoOpen(false);
        return;
      }

      if (event.key !== "Tab" || !modalRef.current) return;

      const focusable = [...modalRef.current.querySelectorAll(focusableSelector)];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.cancelAnimationFrame(focusTimer);
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
      returnFocusRef.current?.focus();
    };
  }, [demoOpen]);

  const openDemo = () => {
    returnFocusRef.current = document.activeElement;
    setSubmitted(false);
    setPhone("");
    setPhoneError("");
    setMenuOpen(false);
    setDemoOpen(true);
  };

  const closeDemo = () => setDemoOpen(false);

  const submitDemo = (event) => {
    event.preventDefault();
    const digits = phone.replace(/\D/g, "");

    if (digits.length < 10 || digits.length > 11) {
      setPhoneError("Digite um telefone de demonstração com DDD e 10 ou 11 números.");
      phoneRef.current?.focus();
      return;
    }

    setPhoneError("");
    setSubmitted(true);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <div className="site-shell" inert={demoOpen ? true : undefined} aria-hidden={demoOpen ? "true" : undefined}>
        <header className={`header ${scrolled ? "header--scrolled" : ""}`}>
          <div className="container header__inner">
            <Brand />
            <nav id="mobile-navigation" className={`nav ${menuOpen ? "nav--open" : ""}`} aria-label="Navegação principal">
              <a href="#como-funciona" onClick={closeMenu}>Como funciona</a>
              <a href="#funcionalidades" onClick={closeMenu}>Recursos</a>
              <a href="#planos" onClick={closeMenu}>Planos</a>
              <a href="#duvidas" onClick={closeMenu}>Dúvidas</a>
              <DemoButton className="nav__mobile-cta" onClick={openDemo}>Explorar demonstração</DemoButton>
            </nav>
            <DemoButton className="header__cta" onClick={openDemo}>Explorar demonstração</DemoButton>
            <button
              ref={menuButtonRef}
              className="menu-button"
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
            >
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </header>

        <main>
          <section className="hero" id="inicio">
            <div className="hero__grid" aria-hidden="true" />
            <div className="container hero__inner">
              <div className="hero__copy">
                <div className="eyebrow"><Sparkles size={14} /> A operação inteira no mesmo ritmo</div>
                <h1>Da agenda ao caixa, <span>tudo no lugar.</span></h1>
                <p className="hero__lead">
                  O Marc conecta agendamento online, lembretes no WhatsApp, equipe e financeiro
                  para sua barbearia ou salão funcionar com menos trabalho manual.
                </p>
                <div className="hero__actions">
                  <DemoButton onClick={openDemo}>Explorar demonstração</DemoButton>
                  <a className="button button--secondary" href="#como-funciona">
                    Ver como funciona
                  </a>
                </div>
                <div className="hero__proofline" aria-label="Principais capacidades do Marc">
                  <span><CalendarCheck2 size={16} /> Agenda 24h</span>
                  <span><MessageCircleMore size={16} /> WhatsApp automático</span>
                  <span><WalletCards size={16} /> Financeiro integrado</span>
                </div>
              </div>
              <div className="hero__visual">
                <div className="hero__badge hero__badge--top">
                  <span><UsersRound size={15} /></span>
                  <div><strong>Operação conectada</strong><small>agenda, equipe e caixa</small></div>
                </div>
                <img
                  src="/assets/marc-dashboard-hero.webp"
                  alt="Dashboard e aplicativo Marc mostrando agenda, clientes e faturamento"
                  width="1448"
                  height="1086"
                  fetchPriority="high"
                />
                <div className="hero__badge hero__badge--bottom">
                  <span><CalendarCheck2 size={15} /></span>
                  <div><strong>Horário confirmado</strong><small>sem mensagem manual</small></div>
                </div>
              </div>
            </div>
            <div className="container hero__trust">
              <span>Feito para quem cuida de pessoas</span>
              <span><Scissors size={17} /> Barbearias</span>
              <span><Sparkles size={17} /> Salões de beleza</span>
              <span><UserRoundCheck size={17} /> Profissionais autônomos</span>
            </div>
          </section>

          <section className="section workflow-section" id="como-funciona">
            <div className="container">
              <div className="section-heading section-heading--wide">
                <span className="section-label">Do link ao caixa</span>
                <h2>Como o Marc entra na sua rotina — <span>sem virar mais uma tarefa.</span></h2>
                <p>Você prepara a operação uma vez. Depois, cada agendamento atualiza o próximo passo.</p>
              </div>
              <ol className="workflow-list">
                {workflow.map(({ icon: Icon, label, title, text }, index) => (
                  <li className="workflow-step" key={title}>
                    <span className="workflow-step__number">0{index + 1}</span>
                    <div className="workflow-step__icon"><Icon size={23} /></div>
                    <small>{label}</small>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </li>
                ))}
              </ol>
              <div className="workflow-note">
                <ShieldCheck size={20} />
                <p><strong>Você não precisa trocar tudo de uma vez.</strong> O fluxo foi pensado para começar pela agenda e conectar o restante conforme sua operação avança.</p>
              </div>
            </div>
          </section>

          <section className="section whatsapp-section">
            <div className="container whatsapp-grid">
              <div className="whatsapp-copy">
                <span className="section-label">O momento que protege a cadeira</span>
                <h2>O lembrete sai.<br /><span>Você segue atendendo.</span></h2>
                <p>
                  Antes do horário, o Marc envia a confirmação pelo WhatsApp. O cliente recebe
                  uma mensagem clara e sua equipe não precisa interromper o dia para cobrar resposta.
                </p>
                <div className="outcome-list">
                  <span><Check size={17} /> Menos confirmações manuais</span>
                  <span><Check size={17} /> Agenda mais previsível</span>
                  <span><Check size={17} /> Histórico no mesmo fluxo</span>
                </div>
                <DemoButton onClick={openDemo}>Ver essa etapa na demonstração</DemoButton>
              </div>
              <div className="whatsapp-visual">
                <img
                  src="/assets/marc-whatsapp-reminder.webp"
                  alt="Celular mostrando um lembrete de agendamento enviado pelo Marc"
                  width="1536"
                  height="1024"
                  loading="lazy"
                  decoding="async"
                />
                <div className="whatsapp-status"><Check size={16} /> Exemplo de confirmação automática</div>
              </div>
            </div>
          </section>

          <section className="section capabilities-section" id="funcionalidades">
            <div className="container capabilities-layout">
              <div className="section-heading">
                <span className="section-label">Uma operação, duas frentes</span>
                <h2>O cliente agenda.<br /><span>O negócio se organiza.</span></h2>
                <p>Os recursos aparecem onde fazem sentido, sem criar seis caminhos concorrentes.</p>
              </div>
              <div className="capability-groups">
                {capabilityGroups.map((group) => (
                  <article className="capability-group" key={group.title}>
                    <header>
                      <h3>{group.title}</h3>
                      <p>{group.description}</p>
                    </header>
                    <div className="capability-list">
                      {group.items.map(({ icon: Icon, title, text }) => (
                        <div className="capability-item" key={title}>
                          <span className="icon-box"><Icon size={21} /></span>
                          <div><h4>{title}</h4><p>{text}</p></div>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="section pricing-section" id="planos">
            <div className="container">
              <div className="section-heading section-heading--center">
                <span className="section-label">Configurações ilustrativas</span>
                <h2>Um formato para cada <span>fase da operação.</span></h2>
                <p>Os perfis abaixo demonstram como o Marc pode se organizar. Valores e condições comerciais ainda estão em definição.</p>
              </div>
              <div className="pricing-grid">
                {plans.map((plan) => (
                  <article className={`price-card ${plan.popular ? "price-card--popular" : ""}`} key={plan.name}>
                    {plan.popular && <span className="popular-pill">Exemplo recomendado</span>}
                    <div className="price-card__head">
                      <h3>{plan.name}</h3>
                      <p>{plan.note}</p>
                    </div>
                    <div className="plan-status"><small>Valores</small><strong>{plan.status}</strong></div>
                    <ul>
                      {plan.items.map((item) => <li key={item}><Check size={17} />{item}</li>)}
                    </ul>
                    <DemoButton className={plan.popular ? "button--dark" : "button--secondary"} onClick={openDemo}>
                      Simular {plan.name}
                    </DemoButton>
                  </article>
                ))}
              </div>
              <p className="pricing-note"><ShieldCheck size={16} /> Nenhuma assinatura ou cobrança é realizada nesta demonstração.</p>
            </div>
          </section>

          <section className="section scenarios-section" id="cenarios">
            <div className="container scenarios-layout">
              <div className="section-heading">
                <span className="section-label">Cenários ilustrativos</span>
                <h2>O que muda na <span>rotina real.</span></h2>
                <p>Exemplos de uso — não depoimentos de clientes — para você reconhecer onde o Marc pode ajudar.</p>
              </div>
              <div className="scenario-list">
                {scenarios.map((item) => (
                  <article className="scenario-item" key={item.role}>
                    <img src={item.image} alt="" loading="lazy" width="96" height="96" />
                    <div>
                      <span>Exemplo de rotina</span>
                      <blockquote>“{item.text}”</blockquote>
                      <strong>{item.role}</strong>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="section faq-section" id="duvidas">
            <div className="container faq-grid">
              <div className="section-heading">
                <span className="section-label">Antes de começar</span>
                <h2>Clareza desde o <span>primeiro passo.</span></h2>
                <p>O que você precisa saber para avaliar o Marc sem compromisso.</p>
              </div>
              <div className="faq-list">
                {[
                  ["Preciso instalar alguma coisa?", "Não. O Marc funciona pelo navegador no celular ou computador."],
                  ["Meus clientes precisam baixar um app?", "Não. Eles recebem seu link e fazem o agendamento pelo navegador."],
                  ["Como começo sem atrapalhar a agenda atual?", "A proposta é configurar serviços, profissionais e horários primeiro. A adoção pode começar pelo link de agendamento e avançar para financeiro e comissões."],
                  ["Esta página cria uma conta real?", "Não. Esta versão é uma demonstração de interface: nenhum cadastro, assinatura ou envio de dados é realizado."],
                ].map(([question, answer]) => (
                  <details key={question}>
                    <summary>{question}<ChevronDown size={19} /></summary>
                    <p>{answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          <section className="final-cta">
            <div className="final-cta__grid" aria-hidden="true" />
            <div className="container final-cta__inner">
              <span className="eyebrow"><Clock3 size={14} /> Explore antes de decidir</span>
              <h2>Veja o fluxo completo.<br /><span>Sem compromisso.</span></h2>
              <p>Simule o primeiro passo e entenda como agenda, WhatsApp, equipe e financeiro se conectam. Nenhum dado é enviado.</p>
              <DemoButton onClick={openDemo}>Abrir demonstração</DemoButton>
            </div>
          </section>
        </main>

        <footer className="footer">
          <div className="container footer__top">
            <div className="footer__brand">
              <Brand />
              <p>A agenda inteligente para barbearias, salões e profissionais de beleza.</p>
            </div>
            <div className="footer__links">
              <div>
                <strong>Produto</strong>
                <a href="#como-funciona">Como funciona</a>
                <a href="#funcionalidades">Recursos</a>
                <a href="#planos">Planos ilustrativos</a>
              </div>
              <div>
                <strong>Informações</strong>
                <a href="#duvidas">Dúvidas</a>
                <a href="mailto:contato@usemarc.com.br">contato@usemarc.com.br</a>
              </div>
            </div>
          </div>
          <div className="container footer__bottom">
            <span>© 2026 Marc. Protótipo demonstrativo.</span>
            <span>Feito com cuidado para quem cuida de pessoas.</span>
          </div>
        </footer>
      </div>

      {demoOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeDemo()}>
          <section
            ref={modalRef}
            className="trial-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-title"
            aria-describedby="demo-description"
          >
            <button ref={closeButtonRef} className="modal-close" type="button" onClick={closeDemo} aria-label="Fechar demonstração">
              <X />
            </button>
            {!submitted ? (
              <>
                <div className="modal-icon"><Sparkles /></div>
                <span className="section-label">Demonstração do cadastro</span>
                <h2 id="demo-title">Simule o primeiro passo do Marc.</h2>
                <p id="demo-description">Use dados fictícios. Nada digitado aqui é enviado ou armazenado.</p>
                <form onSubmit={submitDemo}>
                  <label htmlFor="demo-name">Nome de demonstração</label>
                  <input id="demo-name" required maxLength="80" name="name" placeholder="Ex.: Marina" autoComplete="off" />

                  <label htmlFor="demo-business">Estabelecimento fictício</label>
                  <input id="demo-business" required maxLength="100" name="business" placeholder="Ex.: Studio Modelo" autoComplete="off" />

                  <label htmlFor="demo-phone">Telefone de demonstração</label>
                  <input
                    ref={phoneRef}
                    id="demo-phone"
                    required
                    maxLength="20"
                    name="phone"
                    inputMode="tel"
                    value={phone}
                    onChange={(event) => {
                      setPhone(event.target.value);
                      if (phoneError) setPhoneError("");
                    }}
                    placeholder="(00) 00000-0000"
                    autoComplete="off"
                    aria-invalid={phoneError ? "true" : "false"}
                    aria-describedby="demo-phone-hint demo-phone-error"
                  />
                  <small id="demo-phone-hint" className="field-hint">Use 10 ou 11 números com DDD.</small>
                  <p id="demo-phone-error" className="field-error" role="alert">{phoneError}</p>

                  <button className="button button--primary" type="submit">
                    Concluir simulação<ArrowRight size={18} />
                  </button>
                </form>
                <small className="modal-disclaimer"><ShieldCheck size={14} /> Protótipo sem envio, conta ou cobrança.</small>
              </>
            ) : (
              <div className="success-state" aria-live="polite">
                <span className="success-state__icon"><Check /></span>
                <span className="section-label">Simulação concluída</span>
                <h2 id="demo-title">Este seria o início da configuração.</h2>
                <p id="demo-description">Em um produto ativo, a próxima etapa organizaria serviços, profissionais e horários. Nenhum dado desta simulação foi enviado.</p>
                <button className="button button--primary" type="button" onClick={closeDemo}>Voltar para a página</button>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}

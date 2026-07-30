import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  LayoutDashboard,
  LogOut,
  Scissors,
  Settings,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import AppThemeToggle from "../../components/app-theme-toggle";
import { signOut } from "../auth/actions";
import { createClient } from "../../lib/supabase/server";

export const metadata = { title: "Painel — Marc" };

const roleLabels = {
  owner: "Dono",
  manager: "Gerente",
  receptionist: "Recepção",
  professional: "Profissional",
};

export default async function AppHomePage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) redirect("/entrar");

  const { data: membership } = await supabase
    .from("establishment_memberships")
    .select("role, establishment:establishments(id, name, slug)")
    .eq("user_id", authData.user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!membership?.establishment) redirect("/onboarding");

  const establishment = membership.establishment;
  const firstName =
    authData.user.user_metadata?.full_name?.split(" ")[0] ||
    authData.user.email?.split("@")[0] ||
    "por aí";

  const [{ count: servicesCount }, { count: professionalsCount }, { count: appointmentsCount }] =
    await Promise.all([
      supabase
        .from("services")
        .select("*", { count: "exact", head: true })
        .eq("establishment_id", establishment.id),
      supabase
        .from("professionals")
        .select("*", { count: "exact", head: true })
        .eq("establishment_id", establishment.id)
        .eq("is_active", true),
      supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("establishment_id", establishment.id),
    ]);

  const setupSteps = [
    { label: "Estabelecimento criado", done: true, href: "/app" },
    { label: "Cadastrar primeiro serviço", done: (servicesCount || 0) > 0, href: "/app/servicos" },
    { label: "Configurar disponibilidade", done: false, href: "/app/agenda" },
    { label: "Compartilhar página pública", done: false, href: `/agendar/${establishment.slug}` },
  ];

  const completedSteps = setupSteps.filter((step) => step.done).length;
  const todayLabel = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());

  return (
    <main className="app-layout">
      <aside className="app-sidebar">
        <Link className="app-brand" href="/app">
          <Image src="/assets/marc-logo-cropped.png" alt="Marc" width={208} height={90} priority />
        </Link>
        <nav aria-label="Navegação do painel">
          <Link className="is-active" href="/app"><LayoutDashboard size={19} /> Visão geral</Link>
          <Link href="/app/agenda"><CalendarDays size={19} /> Agenda</Link>
          <Link href="/app/clientes"><UsersRound size={19} /> Clientes</Link>
          <Link href="/app/servicos"><Scissors size={19} /> Serviços</Link>
          <Link href="/app/equipe"><UserRound size={19} /> Equipe</Link>
          <Link href="/app/financeiro"><CircleDollarSign size={19} /> Financeiro</Link>
        </nav>
        <div className="app-sidebar__bottom">
          <Link href="/app/configuracoes"><Settings size={19} /> Configurações</Link>
          <form action={signOut}>
            <button type="submit"><LogOut size={19} /> Sair</button>
          </form>
        </div>
      </aside>

      <section className="app-main">
        <header className="app-topbar">
          <button className="business-switcher" type="button">
            <span>{establishment.name.slice(0, 1).toUpperCase()}</span>
            <div><strong>{establishment.name}</strong><small>{roleLabels[membership.role]}</small></div>
            <ChevronDown size={17} />
          </button>
          <div className="app-topbar__actions">
            <AppThemeToggle />
            <div className="app-avatar">{firstName.slice(0, 1).toUpperCase()}</div>
          </div>
        </header>

        <div className="app-content">
          <header className="dashboard-heading">
            <div>
              <span>{todayLabel}</span>
              <h1>Boa noite, {firstName}.</h1>
              <p>Seu espaço está pronto. Agora vamos colocar a primeira agenda para funcionar.</p>
            </div>
            <Link className="button button--primary" href="/app/agenda">
              <CalendarDays size={18} /> Novo agendamento
            </Link>
          </header>

          <section className="dashboard-summary" aria-label="Resumo da operação">
            <article>
              <span>Atendimentos hoje</span>
              <strong>{appointmentsCount || 0}</strong>
              <small><Clock3 size={14} /> Nenhum conflito</small>
            </article>
            <article>
              <span>Profissionais ativos</span>
              <strong>{professionalsCount || 0}</strong>
              <small><UserRound size={14} /> Equipe conectada</small>
            </article>
            <article>
              <span>Serviços disponíveis</span>
              <strong>{servicesCount || 0}</strong>
              <small><Scissors size={14} /> Catálogo atual</small>
            </article>
          </section>

          <div className="dashboard-grid">
            <section className="today-panel">
              <div className="panel-heading">
                <div><h2>Agenda de hoje</h2><p>Os próximos atendimentos aparecem aqui.</p></div>
                <Link href="/app/agenda">Ver agenda <ArrowRight size={16} /></Link>
              </div>
              <div className="agenda-empty">
                <div className="agenda-empty__visual">
                  <CalendarDays size={27} />
                  <span>09:00</span>
                  <span>10:00</span>
                  <span>11:00</span>
                </div>
                <h3>Sua agenda está livre.</h3>
                <p>Cadastre um serviço para começar a receber agendamentos pelo seu link.</p>
                <Link className="button button--secondary" href="/app/servicos">
                  Cadastrar serviço
                </Link>
              </div>
            </section>

            <aside className="activation-panel">
              <div className="activation-panel__icon"><Sparkles size={20} /></div>
              <span>Primeiros passos</span>
              <h2>Deixe o Marc pronto para trabalhar.</h2>
              <p>{completedSteps} de {setupSteps.length} etapas concluídas</p>
              <div className="activation-progress">
                <span style={{ width: `${(completedSteps / setupSteps.length) * 100}%` }} />
              </div>
              <ul>
                {setupSteps.map((step) => (
                  <li key={step.label} className={step.done ? "is-done" : ""}>
                    <span>{step.done ? <Check size={15} /> : null}</span>
                    <Link href={step.href}>{step.label}</Link>
                    {!step.done && <ArrowRight size={15} />}
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </div>
      </section>

      <nav className="app-mobile-nav" aria-label="Navegação rápida">
        <Link className="is-active" href="/app"><LayoutDashboard size={20} /><span>Início</span></Link>
        <Link href="/app/agenda"><CalendarDays size={20} /><span>Agenda</span></Link>
        <Link href="/app/clientes"><UsersRound size={20} /><span>Clientes</span></Link>
        <Link href="/app/servicos"><Scissors size={20} /><span>Serviços</span></Link>
      </nav>
    </main>
  );
}

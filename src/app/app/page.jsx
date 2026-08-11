import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Scissors,
  Sparkles,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { getAppContext } from "../../lib/app-context";

export const metadata = { title: "Painel — Marc" };

export default async function AppHomePage() {
  const { supabase, user, membership, establishment } = await getAppContext();
  const firstName =
    user.user_metadata?.full_name?.split(" ")[0] ||
    user.email?.split("@")[0] ||
    "por aí";
  const today = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
  const tomorrowDate = new Date(`${today}T12:00:00Z`);
  tomorrowDate.setUTCDate(tomorrowDate.getUTCDate() + 1);
  const tomorrow = tomorrowDate.toISOString().slice(0, 10);

  const [{ count: servicesCount }, { count: professionalsCount }, appointmentsResult, { count: availabilityCount }] =
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
        .select("id, starts_at, status, customer:customers(full_name), professional:professionals(display_name), professional_service:professional_services(service:services(name))", { count: "exact" })
        .eq("establishment_id", establishment.id)
        .gte("starts_at", `${today}T00:00:00-03:00`)
        .lt("starts_at", `${tomorrow}T00:00:00-03:00`)
        .order("starts_at")
        .limit(5),
      supabase
        .from("availability_rules")
        .select("*", { count: "exact", head: true }),
    ]);
  const appointmentsCount = appointmentsResult.count || 0;
  const todayAppointments = appointmentsResult.data || [];

  const setupSteps = [
    { label: "Estabelecimento criado", done: true, href: "/app" },
    { label: "Cadastrar primeiro serviço", done: (servicesCount || 0) > 0, href: "/app/servicos" },
    { label: "Configurar disponibilidade", done: (availabilityCount || 0) > 0, href: "/app/agenda?view=disponibilidade" },
    { label: "Compartilhar página pública", done: false, href: `/agendar/${establishment.slug}` },
  ];

  const completedSteps = setupSteps.filter((step) => step.done).length;
  const todayLabel = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
  const currentHour = Number(new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    hour12: false,
    timeZone: "America/Sao_Paulo",
  }).format(new Date()));
  const greeting = currentHour < 12 ? "Bom dia" : currentHour < 18 ? "Boa tarde" : "Boa noite";
  const hasServices = (servicesCount || 0) > 0;
  const hasAvailability = (availabilityCount || 0) > 0;
  const emptyAgenda = !hasServices
    ? {
        title: "Cadastre seu primeiro serviço.",
        text: "Defina o que você atende, quanto custa e quanto tempo ocupa na agenda.",
        href: "/app/servicos",
        action: "Cadastrar serviço",
      }
    : !hasAvailability
      ? {
          title: "Defina quando você atende.",
          text: "O catálogo já está pronto. Agora informe os dias e horários disponíveis.",
          href: "/app/agenda?view=disponibilidade",
          action: "Configurar disponibilidade",
        }
      : {
          title: "Sua agenda está livre hoje.",
          text: "A operação está configurada. Crie um atendimento ou compartilhe sua página pública.",
          href: "/app/agenda?novo=1",
          action: "Criar agendamento",
        };

  return (
      <div className="app-content">
          <header className="dashboard-heading">
            <div>
              <span>{todayLabel}</span>
              <h1>{greeting}, {firstName}.</h1>
              <p>{completedSteps === setupSteps.length ? "Acompanhe o dia e mantenha a operação em movimento." : "Conclua os primeiros passos para abrir sua agenda aos clientes."}</p>
            </div>
            <Link className="button button--primary" href="/app/agenda?novo=1">
              <CalendarDays size={18} /> Novo agendamento
            </Link>
          </header>

          <section className="dashboard-summary" aria-label="Resumo da operação">
            <article className="is-emphasis"><span>Atendimentos hoje</span><strong>{appointmentsCount || 0}</strong><small><Clock3 size={14} /> Agenda do dia</small></article>
            <article><span>Profissionais ativos</span><strong>{professionalsCount || 0}</strong><small><UserRound size={14} /> Equipe disponível</small></article>
            <article><span>Serviços disponíveis</span><strong>{servicesCount || 0}</strong><small><Scissors size={14} /> Catálogo atual</small></article>
          </section>

          <div className="dashboard-grid">
            <section className="today-panel">
              <div className="panel-heading">
                <div><h2>Agenda de hoje</h2><p>Os próximos atendimentos aparecem aqui.</p></div>
                <Link href="/app/agenda">Ver agenda <ArrowRight size={16} /></Link>
              </div>
              {todayAppointments.length ? (
                <div className="dashboard-appointments">
                  {todayAppointments.map((appointment) => (
                    <article key={appointment.id}>
                      <time>{new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(appointment.starts_at))}</time>
                      <div><strong>{appointment.customer.full_name}</strong><span>{appointment.professional_service.service.name} com {appointment.professional.display_name}</span></div>
                      <em>{appointment.status === "confirmed" ? "Confirmado" : appointment.status}</em>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="agenda-empty">
                  <div className="agenda-empty__visual">
                    <CalendarDays size={27} />
                    <span>09:00</span>
                    <span>10:00</span>
                    <span>11:00</span>
                  </div>
                  <h3>{emptyAgenda.title}</h3>
                  <p>{emptyAgenda.text}</p>
                  <Link className="button button--secondary" href={emptyAgenda.href}>
                    {emptyAgenda.action}
                  </Link>
                </div>
              )}
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

          <nav className="dashboard-quick-create" aria-label="Ações rápidas">
            <Link href="/app/agenda?novo=1"><CalendarDays size={18} /><span><strong>Novo agendamento</strong><small>Reservar um horário</small></span><ArrowRight size={16} /></Link>
            <Link href="/app/clientes?novo=1"><UserRound size={18} /><span><strong>Novo cliente</strong><small>Adicionar contato</small></span><ArrowRight size={16} /></Link>
            <Link href="/app/servicos?novo=1"><Scissors size={18} /><span><strong>Novo serviço</strong><small>Valor e duração</small></span><ArrowRight size={16} /></Link>
          </nav>

      </div>
  );
}

import {
  ArrowLeft,
  CalendarCheck2,
  ChartNoAxesCombined,
  CircleDollarSign,
  Percent,
  TicketCheck,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import ReportExportActions from "../../../components/report-export-actions";
import { getAppContext } from "../../../lib/app-context";

export const metadata = { title: "Relatórios — Marc" };

function money(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value / 100);
}

function currentMonth() {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
}

function monthBounds(month) {
  const startDate = new Date(`${month}-01T12:00:00Z`);
  const nextDate = new Date(startDate);
  nextDate.setUTCMonth(nextDate.getUTCMonth() + 1);
  return {
    start: `${month}-01T00:00:00-03:00`,
    end: `${nextDate.toISOString().slice(0, 7)}-01T00:00:00-03:00`,
  };
}

function percent(part, total) {
  if (!total) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

export default async function ReportsPage({ searchParams }) {
  const { supabase, user, membership, establishment } = await getAppContext();
  if (!["owner", "manager"].includes(membership.role)) redirect("/app");

  const query = await searchParams;
  const selectedMonth = /^\d{4}-(0[1-9]|1[0-2])$/.test(query?.month || "") ? query.month : currentMonth();
  const bounds = monthBounds(selectedMonth);

  const { data: appointments } = await supabase
    .from("appointments")
    .select(`
      id,
      starts_at,
      status,
      source,
      price_cents,
      professional:professionals(id, display_name, color),
      professional_service:professional_services(
        service:services(id, name)
      )
    `)
    .eq("establishment_id", establishment.id)
    .gte("starts_at", bounds.start)
    .lt("starts_at", bounds.end)
    .order("starts_at");

  const list = appointments || [];
  const completed = list.filter((item) => item.status === "completed");
  const cancelled = list.filter((item) => item.status === "cancelled").length;
  const noShow = list.filter((item) => item.status === "no_show").length;
  const finalized = completed.length + cancelled + noShow;
  const revenue = completed.reduce((sum, item) => sum + item.price_cents, 0);
  const averageTicket = completed.length ? Math.round(revenue / completed.length) : 0;
  const publicBookings = list.filter((item) => item.source === "public_booking").length;

  const servicesMap = new Map();
  const professionalsMap = new Map();
  const daysMap = new Map();

  list.forEach((appointment) => {
    const day = new Intl.DateTimeFormat("en-CA", {
      day: "2-digit",
      timeZone: "America/Sao_Paulo",
    }).format(new Date(appointment.starts_at));
    const dayData = daysMap.get(day) || { day, total: 0, completed: 0 };
    dayData.total += 1;
    if (appointment.status === "completed") dayData.completed += 1;
    daysMap.set(day, dayData);

    const professionalId = appointment.professional?.id || "unassigned";
    const professionalData = professionalsMap.get(professionalId) || {
      id: professionalId,
      name: appointment.professional?.display_name || "Sem profissional",
      color: appointment.professional?.color || "#ffa500",
      appointments: 0,
      completed: 0,
      noShow: 0,
      revenue: 0,
    };
    professionalData.appointments += 1;
    if (appointment.status === "completed") {
      professionalData.completed += 1;
      professionalData.revenue += appointment.price_cents;
    }
    if (appointment.status === "no_show") professionalData.noShow += 1;
    professionalsMap.set(professionalId, professionalData);

    if (appointment.status === "completed") {
      const service = appointment.professional_service?.service;
      const serviceId = service?.id || "unassigned";
      const serviceData = servicesMap.get(serviceId) || {
        id: serviceId,
        name: service?.name || "Serviço não identificado",
        count: 0,
        revenue: 0,
      };
      serviceData.count += 1;
      serviceData.revenue += appointment.price_cents;
      servicesMap.set(serviceId, serviceData);
    }
  });

  const services = [...servicesMap.values()].sort((a, b) => b.revenue - a.revenue);
  const professionals = [...professionalsMap.values()].sort((a, b) => b.revenue - a.revenue);
  const days = [...daysMap.values()].sort((a, b) => Number(a.day) - Number(b.day));
  const maxDayTotal = Math.max(...days.map((item) => item.total), 1);
  const monthLabel = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${selectedMonth}-01T12:00:00Z`));

  return (
      <div className="app-content reports-page">
        <header className="product-heading reports-heading">
          <div>
            <span>Decisões com dados reais</span>
            <h1>Relatórios</h1>
            <p>Entenda o movimento do mês, os serviços mais procurados e o resultado de cada profissional.</p>
          </div>
          <div className="report-heading__tools">
            <form className="report-filter">
              <label htmlFor="reportMonth">Período</label>
              <div>
                <input id="reportMonth" name="month" type="month" defaultValue={selectedMonth} max={currentMonth()} />
                <button className="button button--secondary" type="submit">Atualizar</button>
              </div>
            </form>
            <ReportExportActions month={selectedMonth} />
          </div>
        </header>

        <div className="report-period">
          <span>{monthLabel}</span>
          <Link href="/app/financeiro"><ArrowLeft size={14} /> Voltar ao financeiro</Link>
        </div>

        <section className="report-summary" aria-label="Indicadores do período">
          <article><span><CircleDollarSign size={16} /> Faturamento</span><strong>{money(revenue)}</strong><small>{completed.length} {completed.length === 1 ? "concluído" : "concluídos"}</small></article>
          <article><span><TicketCheck size={16} /> Ticket médio</span><strong>{money(averageTicket)}</strong><small>Por atendimento concluído</small></article>
          <article><span><CalendarCheck2 size={16} /> Comparecimento</span><strong>{percent(completed.length, finalized)}</strong><small>{noShow} faltas · {cancelled} cancelamentos</small></article>
          <article><span><Percent size={16} /> Agendamento online</span><strong>{percent(publicBookings, list.length)}</strong><small>{publicBookings} de {list.length} pela página pública</small></article>
        </section>

        <section className="report-volume">
          <div className="section-title">
            <div><h2>Ritmo do mês</h2><p>Volume de horários marcados por dia. A parte destacada representa atendimentos concluídos.</p></div>
            <span>{list.length}</span>
          </div>
          {days.length ? (
            <div className="report-bars" aria-label="Agendamentos por dia">
              {days.map((item) => (
                <div key={item.day} title={`${item.day}: ${item.total} ${item.total === 1 ? "agendamento" : "agendamentos"}, ${item.completed} ${item.completed === 1 ? "concluído" : "concluídos"}`}>
                  <span>
                    <i style={{ height: `${(item.total / maxDayTotal) * 100}%` }}>
                      <b style={{ height: `${item.total ? (item.completed / item.total) * 100 : 0}%` }} />
                    </i>
                  </span>
                  <small>{item.day}</small>
                </div>
              ))}
            </div>
          ) : (
            <div className="report-empty report-empty--compact"><ChartNoAxesCombined size={25} /><h2>Este período ainda não tem movimento.</h2><p>Os dados aparecem aqui assim que o primeiro horário do mês for registrado.</p></div>
          )}
        </section>

        <div className="report-breakdowns">
          <section className="report-table">
            <div className="section-title"><div><h2>Serviços que mais faturaram</h2><p>Somente atendimentos concluídos.</p></div><span>{services.length}</span></div>
            {services.length ? (
              <div className="report-list">
                {services.map((service, index) => (
                  <article key={service.id}>
                    <span>{index + 1}</span>
                    <div><strong>{service.name}</strong><small>{service.count} {service.count === 1 ? "atendimento" : "atendimentos"}</small></div>
                    <em>{money(service.revenue)}</em>
                  </article>
                ))}
              </div>
            ) : <div className="report-empty"><TicketCheck size={24} /><h2>Nenhum serviço concluído.</h2><p>Finalize atendimentos para comparar procura e faturamento.</p></div>}
          </section>

          <section className="report-table">
            <div className="section-title"><div><h2>Desempenho da equipe</h2><p>Produção e presença por profissional.</p></div><span>{professionals.length}</span></div>
            {professionals.length ? (
              <div className="report-list report-list--team">
                {professionals.map((professional) => (
                  <article key={professional.id}>
                    <span className="report-avatar" style={{ "--team-color": professional.color }}>{professional.name.slice(0, 1).toUpperCase()}</span>
                    <div><strong>{professional.name}</strong><small>{professional.completed}/{professional.appointments} concluídos · {professional.noShow} faltas</small></div>
                    <em>{money(professional.revenue)}</em>
                  </article>
                ))}
              </div>
            ) : <div className="report-empty"><UserRound size={24} /><h2>Sem dados da equipe.</h2><p>O desempenho aparece depois que a agenda começa a operar.</p></div>}
          </section>
        </div>
      </div>
  );
}

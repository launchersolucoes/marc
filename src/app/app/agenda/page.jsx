import {
  ArrowLeft,
  ArrowRight,
  Ban,
  CalendarDays,
  Clock3,
  Settings2,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import AppShell from "../../../components/app-shell";
import AppointmentActions from "../../../components/appointment-actions";
import AppointmentForm from "../../../components/appointment-form";
import AvailabilityForm from "../../../components/availability-form";
import TimeOffForm from "../../../components/time-off-form";
import { getAppContext } from "../../../lib/app-context";

export const metadata = { title: "Agenda — Marc" };

const statusLabels = {
  pending: "Pendente",
  confirmed: "Confirmado",
  in_progress: "Em atendimento",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Faltou",
};

function money(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value / 100);
}

function dateInBrazil() {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
}

function moveDate(date, amount) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

function timeParts(date) {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Sao_Paulo",
  }).formatToParts(new Date(date));
  return {
    hour: Number(parts.find((part) => part.type === "hour")?.value || 0),
    minute: Number(parts.find((part) => part.type === "minute")?.value || 0),
  };
}

export default async function AgendaPage({ searchParams }) {
  const query = await searchParams;
  const selectedDate = /^\d{4}-\d{2}-\d{2}$/.test(query?.date || "") ? query.date : dateInBrazil();
  const selectedAppointmentId = /^[0-9a-f-]{36}$/i.test(query?.appointment || "") ? query.appointment : "";
  const view = query?.view === "disponibilidade" ? "disponibilidade" : "agenda";
  const { supabase, user, membership, establishment, professional } = await getAppContext();

  let professionalsQuery = supabase
    .from("professionals")
    .select("id, display_name, color, user_id, professional_services(id, price_cents, duration_minutes, is_active, service:services(name))")
    .eq("establishment_id", establishment.id)
    .eq("is_active", true)
    .order("created_at");
  if (membership.role === "professional") professionalsQuery = professionalsQuery.eq("user_id", user.id);

  const dayEnd = moveDate(selectedDate, 1);
  const [{ data: professionals }, { data: appointments }, { data: rules }, { data: timeOff }] =
    await Promise.all([
      professionalsQuery,
      supabase
        .from("appointments")
        .select("id, starts_at, ends_at, status, price_cents, notes, payment_method, professional:professionals(id, display_name, color), customer:customers(full_name, phone, email), professional_service:professional_services(duration_minutes, service:services(name))")
        .eq("establishment_id", establishment.id)
        .gte("starts_at", `${selectedDate}T00:00:00-03:00`)
        .lt("starts_at", `${dayEnd}T00:00:00-03:00`)
        .order("starts_at"),
      professional
        ? supabase.from("availability_rules").select("weekday, starts_at, ends_at").eq("professional_id", professional.id).order("weekday")
        : Promise.resolve({ data: [] }),
      professional
        ? supabase.from("professional_time_off").select("id, starts_at, ends_at, reason").eq("professional_id", professional.id).gte("ends_at", new Date().toISOString()).order("starts_at").limit(5)
        : Promise.resolve({ data: [] }),
    ]);

  const activeProfessionals = (professionals || []).map((item) => ({
    ...item,
    professional_services: (item.professional_services || []).filter((service) => service.is_active),
  }));
  const rawDateLabel = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${selectedDate}T12:00:00Z`));
  const dateLabel = rawDateLabel.charAt(0).toUpperCase() + rawDateLabel.slice(1);
  const appointmentCount = appointments?.length || 0;
  const selectedAppointment = appointments?.find((item) => item.id === selectedAppointmentId);
  const hours = Array.from({ length: 13 }, (_, index) => index + 8);

  return (
    <AppShell active="agenda" membership={membership} user={user}>
      <div className="app-content agenda-page">
        <header className="product-heading agenda-heading">
          <div>
            <span>Operação do dia</span>
            <h1>Agenda</h1>
            <p>Horários confirmados, equipe e bloqueios na mesma visão.</p>
          </div>
          <nav className="segmented-nav" aria-label="Visões da agenda">
            <Link className={view === "agenda" ? "is-active" : ""} href={`/app/agenda?date=${selectedDate}`}><CalendarDays size={16} /> Agenda</Link>
            <Link className={view === "disponibilidade" ? "is-active" : ""} href={`/app/agenda?view=disponibilidade&date=${selectedDate}`}><Settings2 size={16} /> Disponibilidade</Link>
          </nav>
        </header>

        {view === "agenda" ? (
          <div className="agenda-workspace">
            <section className="schedule-panel">
              <div className="schedule-toolbar">
                <div>
                  <Link aria-label="Dia anterior" href={`/app/agenda?date=${moveDate(selectedDate, -1)}`}><ArrowLeft size={18} /></Link>
                  <Link className="today-link" href="/app/agenda">Hoje</Link>
                  <Link aria-label="Próximo dia" href={`/app/agenda?date=${moveDate(selectedDate, 1)}`}><ArrowRight size={18} /></Link>
                </div>
                <strong>{dateLabel}</strong>
                <span>{appointmentCount} {appointmentCount === 1 ? "atendimento" : "atendimentos"}</span>
              </div>
              {activeProfessionals.length ? (
                <div className="schedule-scroll">
                  <div className="schedule-grid" style={{ "--professional-count": activeProfessionals.length }}>
                    <div className="schedule-corner"><Clock3 size={15} /></div>
                    {activeProfessionals.map((item) => (
                      <div className="schedule-professional" key={item.id}>
                        <span style={{ "--team-color": item.color || "#ffa500" }}>{item.display_name.slice(0, 1)}</span>
                        <strong>{item.display_name}</strong>
                      </div>
                    ))}
                    <div className="schedule-times">
                      {hours.map((hour) => <span key={hour} style={{ top: `${(hour - 8) * 60}px` }}>{String(hour).padStart(2, "0")}:00</span>)}
                    </div>
                    {activeProfessionals.map((item) => (
                      <div className="schedule-column" key={item.id}>
                        {hours.map((hour) => <i key={hour} style={{ top: `${(hour - 8) * 60}px` }} />)}
                        {appointments?.filter((appointment) => appointment.professional.id === item.id).map((appointment) => {
                          const start = timeParts(appointment.starts_at);
                          const end = timeParts(appointment.ends_at);
                          const top = Math.max(0, (start.hour - 8) * 60 + start.minute);
                          const duration = Math.max(32, (end.hour * 60 + end.minute) - (start.hour * 60 + start.minute));
                          return (
                            <Link className={`schedule-event is-${appointment.status}`} href={`/app/agenda?date=${selectedDate}&appointment=${appointment.id}`} key={appointment.id} style={{ top: `${top}px`, height: `${duration}px`, "--team-color": item.color || "#ffa500" }}>
                              <strong>{appointment.customer.full_name}</strong>
                              <span>{String(start.hour).padStart(2, "0")}:{String(start.minute).padStart(2, "0")} · {appointment.professional_service.service.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="agenda-teach-empty"><UserRound size={26} /><h2>Cadastre um profissional primeiro.</h2><p>A agenda precisa de alguém para receber serviços e horários.</p><Link className="button button--secondary" href="/app/equipe">Abrir equipe</Link></div>
              )}
            </section>
            <aside className="appointment-form-card">
              {selectedAppointment ? (
                <div className="appointment-detail">
                  <div className="appointment-detail__top">
                    <Link href={`/app/agenda?date=${selectedDate}`}><ArrowLeft size={15} /> Voltar para novo atendimento</Link>
                    <span className={`status-badge is-${selectedAppointment.status}`}>{statusLabels[selectedAppointment.status]}</span>
                  </div>
                  <div className="appointment-detail__identity">
                    <span>{selectedAppointment.customer.full_name.slice(0, 1).toUpperCase()}</span>
                    <div><h2>{selectedAppointment.customer.full_name}</h2><p>{selectedAppointment.customer.phone}</p></div>
                  </div>
                  <dl>
                    <div><dt>Serviço</dt><dd>{selectedAppointment.professional_service.service.name}</dd></div>
                    <div><dt>Profissional</dt><dd>{selectedAppointment.professional.display_name}</dd></div>
                    <div><dt>Horário</dt><dd>{new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(selectedAppointment.starts_at))}</dd></div>
                    <div><dt>Valor</dt><dd>{money(selectedAppointment.price_cents)}</dd></div>
                  </dl>
                  {selectedAppointment.notes && <div className="appointment-detail__note"><strong>Observações</strong><p>{selectedAppointment.notes}</p></div>}
                  {["completed", "cancelled", "no_show"].includes(selectedAppointment.status) ? (
                    <p className="inline-note">Este atendimento está encerrado e permanece no histórico do cliente.</p>
                  ) : (
                    <AppointmentActions appointmentId={selectedAppointment.id} status={selectedAppointment.status} />
                  )}
                </div>
              ) : activeProfessionals.length
                ? <AppointmentForm professionals={activeProfessionals} defaultDate={selectedDate} />
                : <div className="inline-note">Adicione um profissional para criar atendimentos.</div>}
            </aside>
          </div>
        ) : (
          <div className="availability-layout">
            <section className="availability-card">
              <div className="section-title">
                <div><h2>Sua semana padrão</h2><p>Esses horários definem quando clientes e equipe podem agendar.</p></div>
                {professional && <span>{professional.display_name}</span>}
              </div>
              {professional
                ? <AvailabilityForm professional={professional} rules={rules || []} />
                : <div className="agenda-teach-empty"><Settings2 size={25} /><h2>Seu acesso não possui perfil profissional.</h2><p>Somente o próprio profissional define sua disponibilidade.</p></div>}
            </section>
            <aside className="time-off-card">
              <div className="section-title"><div><h2>Folgas e bloqueios</h2><p>Proteja um período sem alterar sua semana padrão.</p></div></div>
              {professional ? (
                <>
                  <TimeOffForm professionalId={professional.id} />
                  <div className="time-off-list">
                    {timeOff?.map((item) => (
                      <article key={item.id}><Ban size={15} /><span><strong>{item.reason || "Período bloqueado"}</strong><small>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(item.starts_at))}</small></span></article>
                    ))}
                  </div>
                </>
              ) : <p className="inline-note">Conecte um perfil profissional ao seu acesso para criar bloqueios.</p>}
            </aside>
          </div>
        )}
      </div>
    </AppShell>
  );
}

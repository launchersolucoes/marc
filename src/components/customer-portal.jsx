"use client";

import { ArrowLeft, ArrowRight, CalendarDays, Check, ChevronDown, Clock3, History, ListTodo, LoaderCircle, MapPin, Pencil, RefreshCw, Scissors, UserRound, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { isValidPhone, normalizePhone } from "../lib/phone";
import { createClient } from "../lib/supabase/client";

const statusLabels = {
  pending: "Aguardando confirmação",
  confirmed: "Confirmado",
  in_progress: "Em atendimento",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

function localDate(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function formatDate(value, options = {}) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: options.withTime ? "short" : undefined,
  }).format(new Date(value));
}

function money(cents) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export default function CustomerPortal({ initialData, token }) {
  const [data, setData] = useState(initialData);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [cancelId, setCancelId] = useState("");
  const [rescheduleId, setRescheduleId] = useState("");
  const [date, setDate] = useState(localDate(1));
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const now = Date.now();
  const appointments = data.appointments || [];
  const upcoming = useMemo(
    () => appointments
      .filter((item) => new Date(item.starts_at).getTime() > now && ["pending", "confirmed", "in_progress"].includes(item.status))
      .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at)),
    [appointments, now],
  );
  const history = useMemo(
    () => appointments
      .filter((item) => !upcoming.some((future) => future.id === item.id))
      .sort((a, b) => new Date(b.starts_at) - new Date(a.starts_at)),
    [appointments, upcoming],
  );
  const nextAppointment = upcoming[0] || null;
  const cancellationNoticeMinutes = data.establishment.cancellation_notice_minutes ?? 120;
  const canManageAppointment = (appointment) => (
    new Date(appointment.starts_at).getTime() - now >= cancellationNoticeMinutes * 60_000
  );
  const canManageNext = nextAppointment ? canManageAppointment(nextAppointment) : false;
  const repeatAppointment = history.find((item) => item.professional_service_id) || nextAppointment;
  const repeatBookingHref = repeatAppointment?.professional_service_id
    ? `/agendar/${data.establishment.slug}?oferta=${encodeURIComponent(repeatAppointment.professional_service_id)}`
    : `/agendar/${data.establishment.slug}`;
  const firstName = data.customer.name.split(" ")[0];

  async function refresh(successMessage) {
    const supabase = createClient();
    const { data: refreshed, error: refreshError } = await supabase.rpc("get_customer_portal", { raw_token: token });
    if (refreshError || !refreshed) {
      setError("A alteração foi salva, mas não conseguimos atualizar a tela. Recarregue a página.");
      return;
    }
    setData(refreshed);
    setError("");
    setMessage(successMessage);
  }

  async function cancelAppointment(appointmentId) {
    setBusy(`cancel-${appointmentId}`);
    setError("");
    const supabase = createClient();
    const { error: actionError } = await supabase.rpc("cancel_customer_portal_appointment", {
      raw_token: token,
      target_appointment_id: appointmentId,
      cancellation_note: "Cancelado pelo cliente na área de horários",
    });
    setBusy("");
    if (actionError) {
      const detail = actionError.message.toLowerCase();
      setError(detail.includes("rate limit")
        ? "Muitas alterações foram solicitadas em pouco tempo. Aguarde alguns minutos e tente novamente."
        : detail.includes("window")
        ? "O prazo para cancelar online terminou. Fale diretamente com o estabelecimento."
        : "Não foi possível cancelar este horário. Fale com o estabelecimento para receber ajuda.");
      return;
    }
    setCancelId("");
    await refresh("Horário cancelado. A vaga já voltou para a agenda do estabelecimento.");
  }

  async function openReschedule(appointment) {
    setRescheduleId(appointment.id);
    setDate(localDate(1));
    setSlots([]);
    setMessage("");
    setError("");
  }

  async function loadSlots(appointment, selectedDate) {
    setDate(selectedDate);
    setLoadingSlots(true);
    setError("");
    const supabase = createClient();
    const { data: available, error: slotsError } = await supabase.rpc("get_public_available_slots", {
      establishment_slug: data.establishment.slug,
      target_professional_service_id: appointment.professional_service_id,
      booking_date: selectedDate,
    });
    setSlots(slotsError ? [] : (available || []).map((item) => item.slot_start));
    setLoadingSlots(false);
    if (slotsError) setError("Não foi possível consultar a agenda. Escolha outra data ou tente novamente.");
  }

  async function reschedule(appointmentId, slot) {
    setBusy(`reschedule-${appointmentId}`);
    setError("");
    const supabase = createClient();
    const { error: actionError } = await supabase.rpc("reschedule_customer_portal_appointment", {
      raw_token: token,
      target_appointment_id: appointmentId,
      local_start: slot,
    });
    setBusy("");
    if (actionError) {
      const detail = actionError.message.toLowerCase();
      setError(detail.includes("rate limit")
        ? "Muitas alterações foram solicitadas em pouco tempo. Aguarde alguns minutos e tente novamente."
        : detail.includes("window")
        ? "O prazo para reagendar online terminou. Fale diretamente com o estabelecimento."
        : detail.includes("notice")
          ? "O novo horário não respeita a antecedência mínima do estabelecimento."
        : detail.includes("conflict")
        ? "Esse horário acabou de ser ocupado. Escolha outro disponível."
        : "Não foi possível reagendar. Fale com o estabelecimento se o problema continuar.");
      return;
    }
    setRescheduleId("");
    await refresh("Novo horário confirmado. A agenda do estabelecimento já foi atualizada.");
  }

  async function leaveWaitlist(waitlistId) {
    setBusy(`waitlist-${waitlistId}`);
    setError("");
    const supabase = createClient();
    const { error: actionError } = await supabase.rpc("cancel_customer_portal_waitlist", {
      raw_token: token,
      target_waitlist_id: waitlistId,
    });
    setBusy("");
    if (actionError) {
      setError(actionError.message.toLowerCase().includes("rate limit")
        ? "Muitas alterações foram solicitadas em pouco tempo. Aguarde alguns minutos e tente novamente."
        : "Não foi possível remover esta solicitação. Tente novamente.");
      return;
    }
    await refresh("Você saiu da lista de espera.");
  }

  async function updateProfile(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const phone = normalizePhone(form.get("phone"));
    if (!isValidPhone(phone)) {
      setError("Informe um telefone válido, com DDD.");
      return;
    }
    setBusy("profile");
    setError("");
    const supabase = createClient();
    const { error: actionError } = await supabase.rpc("update_customer_portal_profile", {
      raw_token: token,
      customer_name: String(form.get("name") || ""),
      customer_phone: phone,
      customer_email: String(form.get("email") || ""),
    });
    setBusy("");
    if (actionError) {
      const detail = actionError.message.toLowerCase();
      setError(detail.includes("rate limit")
        ? "Muitas alterações foram solicitadas em pouco tempo. Aguarde alguns minutos e tente novamente."
        : detail.includes("phone already")
        ? "Este telefone já pertence a outro cadastro neste estabelecimento."
        : "Não foi possível atualizar seus dados. Revise os campos e tente novamente.");
      return;
    }
    setProfileOpen(false);
    await refresh("Seus dados foram atualizados.");
  }

  return (
    <div className="customer-portal-shell">
      <header className="customer-portal-intro">
        <Link href={`/agendar/${data.establishment.slug}`} className="customer-portal-back"><ArrowLeft size={16} /> {data.establishment.name}</Link>
        <h1>Olá, {firstName}.</h1>
        <p>{nextAppointment ? "Seu próximo horário está pronto para você." : "Seus horários e solicitações ficam reunidos aqui."}</p>
      </header>

      {(message || error) && <div className={`customer-portal-message ${error ? "is-error" : "is-success"}`} role={error ? "alert" : "status"}>{error || <><Check size={17} /> {message}</>}</div>}

      {nextAppointment ? (
        <section className="appointment-pass" aria-labelledby="nextAppointmentTitle">
          <div className="appointment-pass__date">
            <span>{new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(new Date(nextAppointment.starts_at)).replace(".", "")}</span>
            <strong>{new Intl.DateTimeFormat("pt-BR", { day: "2-digit" }).format(new Date(nextAppointment.starts_at))}</strong>
            <small>{new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(new Date(nextAppointment.starts_at)).replace(".", "")}</small>
          </div>
          <div className="appointment-pass__body">
            <div className="appointment-pass__status"><span />{statusLabels[nextAppointment.status]}</div>
            <h2 id="nextAppointmentTitle">{nextAppointment.service_name}</h2>
            <div className="appointment-pass__facts">
              <span><Clock3 size={16} /> {new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" }).format(new Date(nextAppointment.starts_at))}</span>
              <span><UserRound size={16} /> {nextAppointment.professional_name}</span>
              <span><Scissors size={16} /> {money(nextAppointment.price_cents)}</span>
            </div>
            {canManageNext ? <div className="appointment-pass__actions">
              <button className="button button--secondary" type="button" onClick={() => openReschedule(nextAppointment)}><RefreshCw size={16} /> Reagendar</button>
              <button className="button button--quiet" type="button" onClick={() => setCancelId(nextAppointment.id)}>Cancelar horário</button>
            </div> : <p className="appointment-pass__policy">O prazo para alterar online terminou. Fale com o estabelecimento se precisar de ajuda.</p>}
          </div>
        </section>
      ) : (
        <section className="customer-portal-empty">
          <CalendarDays size={24} />
          <h2>Nenhum horário marcado.</h2>
          <p>Quando quiser voltar, escolha serviço, profissional e um horário disponível.</p>
          <Link className="button button--primary" href={repeatBookingHref}>Agendar um horário <ArrowRight size={17} /></Link>
        </section>
      )}

      {cancelId && (
        <section className="customer-portal-confirm" aria-label="Confirmar cancelamento">
          <div><strong>Cancelar este horário?</strong><span>A vaga será liberada imediatamente para outra pessoa.</span></div>
          <button className="button button--danger" type="button" disabled={busy === `cancel-${cancelId}`} onClick={() => cancelAppointment(cancelId)}>{busy === `cancel-${cancelId}` ? <><LoaderCircle className="spin" size={16} /> Cancelando</> : "Confirmar cancelamento"}</button>
          <button className="button button--quiet" type="button" onClick={() => setCancelId("")}>Manter horário</button>
        </section>
      )}

      {rescheduleId && (() => {
        const appointment = appointments.find((item) => item.id === rescheduleId);
        return appointment ? (
          <section className="customer-portal-reschedule">
            <header><div><strong>Escolha o novo horário</strong><span>O horário atual permanece reservado até você confirmar outro.</span></div><button type="button" onClick={() => setRescheduleId("")} aria-label="Fechar reagendamento"><X size={18} /></button></header>
            <label htmlFor="portalRescheduleDate">Nova data</label>
            <input id="portalRescheduleDate" type="date" min={localDate()} max={localDate(data.establishment.max_booking_days || 60)} value={date} onChange={(event) => loadSlots(appointment, event.target.value)} />
            {loadingSlots ? <div className="customer-portal-slot-state"><LoaderCircle className="spin" size={17} /> Consultando agenda</div> : slots.length ? (
              <div className="customer-portal-slots">{slots.map((slot) => <button type="button" key={slot} disabled={busy === `reschedule-${appointment.id}`} onClick={() => reschedule(appointment.id, slot)}>{slot.slice(11, 16)}</button>)}</div>
            ) : <div className="customer-portal-slot-state">Escolha uma data para ver os horários livres.</div>}
          </section>
        ) : null;
      })()}

      {(data.waitlist || []).length > 0 && (
        <section className="customer-portal-section">
          <header><div><ListTodo size={19} /><span><strong>Lista de espera</strong><small>Solicitações ainda abertas</small></span></div></header>
          <div className="customer-waitlist-list">{data.waitlist.map((item) => (
            <article key={item.id}>
              <div><strong>{item.service_name}</strong><span>{formatDate(`${item.preferred_date}T12:00:00`)} · {item.professional_name}</span></div>
              <button type="button" disabled={busy === `waitlist-${item.id}`} onClick={() => leaveWaitlist(item.id)}>{busy === `waitlist-${item.id}` ? "Removendo" : "Sair da lista"}</button>
            </article>
          ))}</div>
        </section>
      )}

      {upcoming.length > 1 && (
        <section className="customer-portal-section">
          <header><div><CalendarDays size={19} /><span><strong>Próximos horários</strong><small>Depois do seu próximo atendimento</small></span></div></header>
          <div className="customer-appointment-list">{upcoming.slice(1).map((item) => (
            <article key={item.id}>
              <time>{formatDate(item.starts_at, { withTime: true })}</time>
              <div><strong>{item.service_name}</strong><span>{item.professional_name}</span></div>
              <div className="customer-appointment-list__controls">
                <span>{statusLabels[item.status]}</span>
                {canManageAppointment(item) ? <span className="customer-appointment-list__actions">
                  <button type="button" onClick={() => openReschedule(item)}>Reagendar</button>
                  <button type="button" onClick={() => setCancelId(item.id)}>Cancelar</button>
                </span> : <small>Alterações online encerradas</small>}
              </div>
            </article>
          ))}</div>
        </section>
      )}

      <section className="customer-portal-section">
        <header><div><History size={19} /><span><strong>Histórico</strong><small>Atendimentos dos últimos 12 meses</small></span></div></header>
        {history.length ? <div className="customer-appointment-list">{history.map((item) => (
          <article key={item.id}><time>{formatDate(item.starts_at, { withTime: true })}</time><div><strong>{item.service_name}</strong><span>{item.professional_name}</span></div><span className={`status-${item.status}`}>{statusLabels[item.status]}</span></article>
        ))}</div> : <p className="customer-portal-section__empty">Seu histórico aparecerá aqui depois do primeiro atendimento.</p>}
      </section>

      <section className="customer-profile-section">
        <button type="button" onClick={() => setProfileOpen((current) => !current)} aria-expanded={profileOpen}>
          <span><Pencil size={17} /><span><strong>Seus dados</strong><small>{data.customer.phone}{data.customer.email ? ` · ${data.customer.email}` : ""}</small></span></span><ChevronDown size={18} />
        </button>
        {profileOpen && <form onSubmit={updateProfile}>
          <div className="field"><label htmlFor="portalName">Nome</label><input id="portalName" name="name" defaultValue={data.customer.name} minLength={2} required /></div>
          <div className="field"><label htmlFor="portalPhone">Telefone</label><input id="portalPhone" name="phone" type="tel" defaultValue={data.customer.phone} required /></div>
          <div className="field"><label htmlFor="portalEmail">E-mail <span>opcional</span></label><input id="portalEmail" name="email" type="email" defaultValue={data.customer.email || ""} /></div>
          <button className="button button--primary" type="submit" disabled={busy === "profile"}>{busy === "profile" ? <><LoaderCircle className="spin" size={16} /> Salvando</> : "Salvar meus dados"}</button>
        </form>}
      </section>

      <footer className="customer-portal-footer">
        <div><MapPin size={16} /><span>{[data.establishment.address, data.establishment.city, data.establishment.state].filter(Boolean).join(" · ") || data.establishment.name}</span></div>
        <Link href={repeatBookingHref}>Agendar novamente <ArrowRight size={15} /></Link>
      </footer>
      <p className="customer-portal-access-note">Este link é pessoal. Se ele tiver sido compartilhado por engano, peça ao estabelecimento para substituir ou revogar o acesso.</p>
    </div>
  );
}

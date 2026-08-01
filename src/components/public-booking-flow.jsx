"use client";

import { CalendarCheck2, Check, ChevronRight, Clock3, ListTodo, LoaderCircle, Scissors, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { isValidPhone, normalizePhone } from "../lib/phone";
import { createClient } from "../lib/supabase/client";

function localDate(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function money(cents) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export default function PublicBookingFlow({ establishment }) {
  const offerings = establishment.offerings || [];
  const services = useMemo(
    () => Array.from(new Map(offerings.map((item) => [item.service_id, {
      id: item.service_id,
      name: item.service_name,
      description: item.service_description,
    }])).values()),
    [offerings],
  );
  const [serviceId, setServiceId] = useState(services[0]?.id || "");
  const serviceOfferings = useMemo(() => offerings.filter((item) => item.service_id === serviceId), [offerings, serviceId]);
  const [offeringId, setOfferingId] = useState(serviceOfferings[0]?.id || "");
  const [date, setDate] = useState(localDate(1));
  const [slots, setSlots] = useState([]);
  const [slot, setSlot] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(null);
  const [waitlisted, setWaitlisted] = useState(null);
  const selectedOffering = offerings.find((item) => item.id === offeringId);

  useEffect(() => {
    const nextOfferings = offerings.filter((item) => item.service_id === serviceId);
    if (!nextOfferings.some((item) => item.id === offeringId)) setOfferingId(nextOfferings[0]?.id || "");
  }, [serviceId, offeringId, offerings]);

  useEffect(() => {
    let active = true;
    setSlot("");
    setError("");
    if (!offeringId || !date) {
      setSlots([]);
      return () => { active = false; };
    }

    async function loadSlots() {
      setLoadingSlots(true);
      const supabase = createClient();
      const { data, error: slotsError } = await supabase.rpc("get_public_available_slots", {
        establishment_slug: establishment.slug,
        target_professional_service_id: offeringId,
        booking_date: date,
      });
      if (!active) return;
      setSlots(slotsError ? [] : (data || []).map((item) => item.slot_start));
      setError(slotsError ? "Não foi possível consultar os horários. Tente novamente." : "");
      setLoadingSlots(false);
    }

    loadSlots();
    return () => { active = false; };
  }, [date, establishment.slug, offeringId]);

  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const customerPhone = normalizePhone(form.get("phone"));
    if (!isValidPhone(customerPhone)) {
      setError("Informe um número de WhatsApp válido, com DDD.");
      return;
    }
    setSubmitting(true);
    setError("");
    const supabase = createClient();
    if (!slot) {
      const { data, error: waitlistError } = await supabase.rpc("create_public_waitlist_entry", {
        establishment_slug: establishment.slug,
        target_professional_service_id: offeringId,
        customer_name: String(form.get("name") || ""),
        customer_phone: customerPhone,
        customer_email: String(form.get("email") || ""),
        target_preferred_date: date,
        waitlist_notes: "",
      });
      setSubmitting(false);
      if (waitlistError) {
        setError("Não foi possível entrar na lista de espera. Revise seus dados e tente novamente.");
        return;
      }
      setWaitlisted({
        id: data,
        name: String(form.get("name") || ""),
        service: selectedOffering.service_name,
        professional: selectedOffering.professional_name,
        date,
      });
      return;
    }

    const { data, error: bookingError } = await supabase.rpc("create_public_appointment", {
      establishment_slug: establishment.slug,
      target_professional_service_id: offeringId,
      customer_name: String(form.get("name") || ""),
      customer_phone: customerPhone,
      customer_email: String(form.get("email") || ""),
      local_start: slot,
    });

    if (bookingError) {
      setSubmitting(false);
      setError(bookingError.message.toLowerCase().includes("conflict")
        ? "Esse horário acabou de ser reservado. Escolha outro disponível."
        : "Não foi possível confirmar. Revise seus dados e tente novamente.");
      const { data: refreshed } = await supabase.rpc("get_public_available_slots", {
        establishment_slug: establishment.slug,
        target_professional_service_id: offeringId,
        booking_date: date,
      });
      setSlots((refreshed || []).map((item) => item.slot_start));
      setSlot("");
      return;
    }

    setConfirmed({
      id: data,
      service: selectedOffering.service_name,
      professional: selectedOffering.professional_name,
      start: slot,
      name: String(form.get("name") || ""),
    });
    setSubmitting(false);
  }

  if (!offerings.length) {
    return (
      <div className="booking-unavailable">
        <CalendarCheck2 size={28} />
        <h2>Agenda em configuração</h2>
        <p>Este estabelecimento ainda está preparando serviços e horários. Volte em breve.</p>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="booking-confirmed" role="status">
        <div><Check size={30} /></div>
        <span>Horário confirmado</span>
        <h2>Pronto, {confirmed.name.split(" ")[0]}.</h2>
        <p>Sua reserva já entrou na agenda de {confirmed.professional}.</p>
        <dl>
          <div><dt>Serviço</dt><dd>{confirmed.service}</dd></div>
          <div><dt>Quando</dt><dd>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" }).format(new Date(confirmed.start))}</dd></div>
        </dl>
        <small>Guarde esta página como confirmação. O lembrete por WhatsApp será ativado em uma próxima etapa do Marc.</small>
      </div>
    );
  }

  if (waitlisted) {
    return (
      <div className="booking-confirmed booking-waitlisted" role="status">
        <div><ListTodo size={28} /></div>
        <span>Lista de espera</span>
        <h2>Pedido registrado, {waitlisted.name.split(" ")[0]}.</h2>
        <p>A equipe já pode ver sua preferência e entrar em contato quando encontrar um horário.</p>
        <dl>
          <div><dt>Serviço</dt><dd>{waitlisted.service}</dd></div>
          <div><dt>Profissional</dt><dd>{waitlisted.professional}</dd></div>
          <div><dt>Data desejada</dt><dd>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${waitlisted.date}T12:00:00Z`))}</dd></div>
        </dl>
        <small>O contato automático por WhatsApp será ativado em uma próxima etapa. Por enquanto, o estabelecimento fará o retorno diretamente.</small>
      </div>
    );
  }

  return (
    <form className="public-booking-form" onSubmit={submit}>
      <div className="booking-form-heading">
        <span>Seu horário</span>
        <h2>Reserve em poucos passos.</h2>
      </div>

      <div className="booking-choice">
        <label htmlFor="publicService"><Scissors size={17} /> Serviço</label>
        <select id="publicService" value={serviceId} onChange={(event) => setServiceId(event.target.value)}>
          {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
        </select>
      </div>

      <div className="booking-choice">
        <label htmlFor="publicProfessional"><UserRound size={17} /> Profissional</label>
        <select id="publicProfessional" value={offeringId} onChange={(event) => setOfferingId(event.target.value)}>
          {serviceOfferings.map((offering) => (
            <option key={offering.id} value={offering.id}>
              {offering.professional_name} · {offering.duration_minutes} min · {money(offering.price_cents)}
            </option>
          ))}
        </select>
      </div>

      <div className="booking-choice">
        <label htmlFor="publicDate"><CalendarCheck2 size={17} /> Data</label>
        <input id="publicDate" type="date" min={localDate()} max={localDate(60)} value={date} onChange={(event) => setDate(event.target.value)} />
      </div>

      <fieldset className="slot-picker">
        <legend><Clock3 size={17} /> Horários disponíveis</legend>
        {loadingSlots ? (
          <div className="slot-loading"><LoaderCircle className="spin" size={18} /> Consultando agenda</div>
        ) : slots.length ? (
          <div>
            {slots.map((item) => {
              const time = item.slice(11, 16);
              return (
                <label key={item}>
                  <input type="radio" name="slot" value={item} checked={slot === item} onChange={() => setSlot(item)} />
                  <span>{time}</span>
                </label>
              );
            })}
          </div>
        ) : <p>Nenhum horário livre nesta data. Escolha outro dia ou entre na lista de espera.</p>}
      </fieldset>

      <div className="booking-customer-fields">
        <div className="field"><label htmlFor="bookingName">Seu nome</label><input id="bookingName" name="name" autoComplete="name" placeholder="Nome completo" minLength={2} required /></div>
        <div className="field"><label htmlFor="bookingPhone">WhatsApp</label><input id="bookingPhone" name="phone" type="tel" autoComplete="tel" placeholder="(00) 00000-0000" minLength={8} required /></div>
        <div className="field booking-email"><label htmlFor="bookingEmail">E-mail <span>opcional</span></label><input id="bookingEmail" name="email" type="email" autoComplete="email" placeholder="voce@email.com" /></div>
      </div>

      {error && <p className="form-message form-message--error" role="alert">{error}</p>}
      <button className="button button--primary booking-submit" type="submit" disabled={submitting || loadingSlots || Boolean(error && !slots.length)}>
        {submitting
          ? <><LoaderCircle className="spin" size={18} /> Enviando</>
          : slot
            ? <>Confirmar meu horário <ChevronRight size={18} /></>
            : <><ListTodo size={18} /> Entrar na lista de espera</>}
      </button>
    </form>
  );
}

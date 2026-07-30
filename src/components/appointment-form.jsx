"use client";

import { CalendarPlus, CheckCircle2, LoaderCircle } from "lucide-react";
import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { createAppointment } from "../app/app/agenda/actions";

const initialState = { error: "", success: "" };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button className="button button--primary appointment-submit" type="submit" disabled={pending}>
      {pending ? <><LoaderCircle className="spin" size={17} /> Confirmando</> : <><CalendarPlus size={17} /> Confirmar atendimento</>}
    </button>
  );
}

export default function AppointmentForm({ professionals, defaultDate }) {
  const [professionalId, setProfessionalId] = useState(professionals[0]?.id || "");
  const [state, action] = useActionState(createAppointment, initialState);
  const selected = useMemo(() => professionals.find((professional) => professional.id === professionalId), [professionals, professionalId]);

  return (
    <form className="appointment-form" action={action}>
      <div className="appointment-form__heading">
        <div><CalendarPlus size={20} /></div>
        <h2>Novo atendimento</h2>
        <p>O horário entra confirmado e o Marc protege a agenda contra conflitos.</p>
      </div>
      <div className="field-grid">
        <div className="field"><label htmlFor="customerName">Cliente</label><input id="customerName" name="customerName" placeholder="Nome completo" required /></div>
        <div className="field"><label htmlFor="customerPhone">WhatsApp</label><input id="customerPhone" name="customerPhone" type="tel" inputMode="tel" placeholder="(00) 00000-0000" required /></div>
      </div>
      <div className="field"><label htmlFor="customerEmail">E-mail <span>opcional</span></label><input id="customerEmail" name="customerEmail" type="email" placeholder="cliente@email.com" /></div>
      <div className="field-grid">
        <div className="field">
          <label htmlFor="appointmentProfessional">Profissional</label>
          <select id="appointmentProfessional" value={professionalId} onChange={(event) => setProfessionalId(event.target.value)}>
            {professionals.map((professional) => <option key={professional.id} value={professional.id}>{professional.display_name}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="professionalServiceId">Serviço</label>
          <select key={professionalId} id="professionalServiceId" name="professionalServiceId" defaultValue="" required>
            <option value="" disabled>Escolha</option>
            {selected?.professional_services?.map((item) => (
              <option value={item.id} key={item.id}>
                {item.service.name} · {item.duration_minutes} min · R$ {(item.price_cents / 100).toFixed(2).replace(".", ",")}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field"><label htmlFor="appointmentStart">Data e hora</label><input id="appointmentStart" name="startsAt" type="datetime-local" defaultValue={`${defaultDate}T09:00`} required /></div>
      <div className="field"><label htmlFor="appointmentNotes">Observações <span>opcional</span></label><input id="appointmentNotes" name="notes" placeholder="Preferências ou recados para a equipe" /></div>
      {!selected?.professional_services?.length && <p className="inline-note">Esse profissional ainda não configurou serviços e valores.</p>}
      {state.error && <p className="form-message form-message--error" role="alert">{state.error}</p>}
      {state.success && <div className="form-message form-message--success"><CheckCircle2 size={17} />{state.success}</div>}
      <Submit />
    </form>
  );
}

"use client";

import { Ban, CheckCircle2, LoaderCircle } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createTimeOff } from "../app/app/agenda/actions";

const initialState = { error: "", success: "" };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button className="button button--secondary" type="submit" disabled={pending}>
      {pending ? <><LoaderCircle className="spin" size={17} /> Bloqueando</> : <><Ban size={17} /> Bloquear período</>}
    </button>
  );
}

export default function TimeOffForm({ professionalId }) {
  const [state, action] = useActionState(createTimeOff, initialState);
  return (
    <form className="time-off-form" action={action}>
      <input type="hidden" name="professionalId" value={professionalId} />
      <div className="field-grid">
        <div className="field"><label htmlFor="timeOffStart">Início</label><input id="timeOffStart" name="startsAt" type="datetime-local" required /></div>
        <div className="field"><label htmlFor="timeOffEnd">Fim</label><input id="timeOffEnd" name="endsAt" type="datetime-local" required /></div>
      </div>
      <div className="field"><label htmlFor="timeOffReason">Motivo <span>opcional</span></label><input id="timeOffReason" name="reason" placeholder="Folga, compromisso, almoço..." /></div>
      {state.error && <p className="form-message form-message--error" role="alert">{state.error}</p>}
      {state.success && <div className="form-message form-message--success"><CheckCircle2 size={17} />{state.success}</div>}
      <Submit />
    </form>
  );
}

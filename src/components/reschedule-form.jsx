"use client";

import { CalendarClock, CheckCircle2, LoaderCircle } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { rescheduleAppointment } from "../app/app/agenda/actions";

const initialState = { error: "", success: "" };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button className="button button--secondary" type="submit" disabled={pending}>
      {pending ? <><LoaderCircle className="spin" size={15} /> Reagendando</> : <><CalendarClock size={15} /> Reagendar</>}
    </button>
  );
}

export default function RescheduleForm({ appointmentId, defaultStart }) {
  const [state, action] = useActionState(rescheduleAppointment, initialState);
  return (
    <form className="reschedule-form" action={action}>
      <input type="hidden" name="appointmentId" value={appointmentId} />
      <div className="field">
        <label htmlFor={`reschedule-${appointmentId}`}>Nova data e hora</label>
        <input id={`reschedule-${appointmentId}`} name="startsAt" type="datetime-local" defaultValue={defaultStart} required />
      </div>
      <Submit />
      {state.error && <p className="form-message form-message--error" role="alert">{state.error}</p>}
      {state.success && <p className="form-message form-message--success"><CheckCircle2 size={15} />{state.success}</p>}
    </form>
  );
}


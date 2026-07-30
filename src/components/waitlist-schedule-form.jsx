"use client";

import { Ban, CalendarPlus, CheckCircle2, LoaderCircle } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { cancelWaitlist, scheduleWaitlist } from "../app/app/lista-espera/actions";

const initialState = { error: "", success: "" };

function ScheduleSubmit() {
  const { pending } = useFormStatus();
  return (
    <button className="button button--primary" type="submit" disabled={pending}>
      {pending ? <><LoaderCircle className="spin" size={15} /> Agendando</> : <><CalendarPlus size={15} /> Confirmar horário</>}
    </button>
  );
}

function CancelSubmit() {
  const { pending } = useFormStatus();
  return <button className="waitlist-cancel" type="submit" disabled={pending}><Ban size={14} /> Remover</button>;
}

export default function WaitlistScheduleForm({ entry }) {
  const [scheduleState, scheduleAction] = useActionState(scheduleWaitlist, initialState);
  const [cancelState, cancelAction] = useActionState(cancelWaitlist, initialState);

  return (
    <div className="waitlist-actions">
      <form action={scheduleAction}>
        <input type="hidden" name="waitlistId" value={entry.id} />
        <div className="field">
          <label htmlFor={`waitlistStart-${entry.id}`}>Novo horário</label>
          <input id={`waitlistStart-${entry.id}`} name="startsAt" type="datetime-local" defaultValue={`${entry.preferred_date}T09:00`} required />
        </div>
        <ScheduleSubmit />
      </form>
      <form action={cancelAction}>
        <input type="hidden" name="waitlistId" value={entry.id} />
        <CancelSubmit />
      </form>
      {(scheduleState.error || cancelState.error) && <p className="form-message form-message--error" role="alert">{scheduleState.error || cancelState.error}</p>}
      {(scheduleState.success || cancelState.success) && <p className="form-message form-message--success"><CheckCircle2 size={15} />{scheduleState.success || cancelState.success}</p>}
    </div>
  );
}


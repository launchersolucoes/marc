"use client";

import { CheckCircle2, LoaderCircle, Save } from "lucide-react";
import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { saveAvailability } from "../app/app/agenda/actions";

const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const initialState = { error: "", success: "" };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button className="button button--primary" type="submit" disabled={pending}>
      {pending ? <><LoaderCircle className="spin" size={17} /> Salvando</> : <><Save size={17} /> Salvar horários</>}
    </button>
  );
}

export default function AvailabilityForm({ professional, rules = [] }) {
  const initialDays = useMemo(() => dayNames.map((name, weekday) => {
    const rule = rules.find((item) => item.weekday === weekday);
    return {
      weekday,
      name,
      enabled: Boolean(rule),
      starts_at: rule?.starts_at?.slice(0, 5) || "09:00",
      ends_at: rule?.ends_at?.slice(0, 5) || "18:00",
    };
  }), [rules]);
  const [days, setDays] = useState(initialDays);
  const [state, action] = useActionState(saveAvailability, initialState);
  const schedule = days.filter((day) => day.enabled).map(({ weekday, starts_at, ends_at }) => ({ weekday, starts_at, ends_at }));

  function updateDay(index, patch) {
    setDays((current) => current.map((day, dayIndex) => dayIndex === index ? { ...day, ...patch } : day));
  }

  return (
    <form className="availability-form" action={action}>
      <input type="hidden" name="professionalId" value={professional.id} />
      <input type="hidden" name="schedule" value={JSON.stringify(schedule)} />
      <div className="availability-list">
        {days.map((day, index) => (
          <div className={`availability-row ${day.enabled ? "is-enabled" : ""}`} key={day.weekday}>
            <label className="day-toggle">
              <input type="checkbox" checked={day.enabled} onChange={(event) => updateDay(index, { enabled: event.target.checked })} />
              <span />
              <strong>{day.name}</strong>
            </label>
            {day.enabled ? (
              <div className="availability-times">
                <input type="time" value={day.starts_at} onChange={(event) => updateDay(index, { starts_at: event.target.value })} aria-label={`Início na ${day.name}`} />
                <span>até</span>
                <input type="time" value={day.ends_at} onChange={(event) => updateDay(index, { ends_at: event.target.value })} aria-label={`Fim na ${day.name}`} />
              </div>
            ) : <span className="day-closed">Fechado</span>}
          </div>
        ))}
      </div>
      {state.error && <p className="form-message form-message--error" role="alert">{state.error}</p>}
      {state.success && <div className="form-message form-message--success"><CheckCircle2 size={17} />{state.success}</div>}
      <Submit />
    </form>
  );
}

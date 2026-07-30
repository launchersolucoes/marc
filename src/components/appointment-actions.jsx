"use client";

import {
  Ban,
  Check,
  CircleDollarSign,
  LoaderCircle,
  Play,
  UserX,
} from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { transitionAppointment } from "../app/app/agenda/actions";

const initialState = { error: "", success: "" };

function ActionButton({ children, icon: Icon, value, tone = "secondary" }) {
  const { pending } = useFormStatus();
  return (
    <button className={`button button--${tone}`} type="submit" name="status" value={value} disabled={pending}>
      {pending ? <LoaderCircle className="spin" size={16} /> : <Icon size={16} />}
      {children}
    </button>
  );
}

export default function AppointmentActions({ appointmentId, status }) {
  const [state, action] = useActionState(transitionAppointment, initialState);

  return (
    <form className="appointment-actions" action={action}>
      <input type="hidden" name="appointmentId" value={appointmentId} />

      {status === "pending" && (
        <div className="appointment-actions__grid">
          <ActionButton icon={Check} value="confirmed" tone="primary">Confirmar</ActionButton>
          <ActionButton icon={Ban} value="cancelled">Cancelar</ActionButton>
        </div>
      )}

      {status === "confirmed" && (
        <div className="appointment-actions__grid">
          <ActionButton icon={Play} value="in_progress" tone="primary">Iniciar atendimento</ActionButton>
          <ActionButton icon={UserX} value="no_show">Marcar falta</ActionButton>
          <ActionButton icon={Ban} value="cancelled">Cancelar</ActionButton>
        </div>
      )}

      {status === "in_progress" && (
        <>
          <div className="field">
            <label htmlFor="paymentMethod">Forma de pagamento</label>
            <select id="paymentMethod" name="paymentMethod" defaultValue="pix">
              <option value="pix">Pix</option>
              <option value="cash">Dinheiro</option>
              <option value="credit_card">Cartão de crédito</option>
              <option value="debit_card">Cartão de débito</option>
              <option value="other">Outro</option>
            </select>
          </div>
          <div className="appointment-actions__grid">
            <ActionButton icon={CircleDollarSign} value="completed" tone="primary">Concluir e lançar</ActionButton>
            <ActionButton icon={Ban} value="cancelled">Cancelar</ActionButton>
          </div>
        </>
      )}

      {state.error && <p className="form-message form-message--error" role="alert">{state.error}</p>}
      {state.success && <p className="form-message form-message--success"><Check size={16} />{state.success}</p>}
    </form>
  );
}

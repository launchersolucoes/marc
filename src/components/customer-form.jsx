"use client";

import { CheckCircle2, LoaderCircle, UserPlus } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createCustomer } from "../app/app/clientes/actions";

const initialState = { error: "", success: "" };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button className="button button--primary customer-submit" type="submit" disabled={pending}>
      {pending ? <><LoaderCircle className="spin" size={17} /> Salvando</> : <><UserPlus size={17} /> Adicionar cliente</>}
    </button>
  );
}

export default function CustomerForm() {
  const [state, action] = useActionState(createCustomer, initialState);
  return (
    <form className="customer-form" action={action}>
      <div className="team-form__heading">
        <h2>Novo cliente</h2>
        <p>Cadastre contatos recebidos fora do agendamento online.</p>
      </div>
      <div className="field"><label htmlFor="customerFullName">Nome</label><input id="customerFullName" name="fullName" placeholder="Nome completo" required /></div>
      <div className="field"><label htmlFor="customerPhoneManual">WhatsApp</label><input id="customerPhoneManual" name="phone" type="tel" placeholder="(00) 00000-0000" required /></div>
      <div className="field"><label htmlFor="customerEmailManual">E-mail <span>opcional</span></label><input id="customerEmailManual" name="email" type="email" placeholder="cliente@email.com" /></div>
      <div className="field"><label htmlFor="customerNotes">Observações <span>opcional</span></label><textarea id="customerNotes" name="notes" rows={3} placeholder="Preferências, alergias ou informações úteis" /></div>
      {state.error && <p className="form-message form-message--error" role="alert">{state.error}</p>}
      {state.success && <div className="form-message form-message--success"><CheckCircle2 size={17} />{state.success}</div>}
      <Submit />
    </form>
  );
}

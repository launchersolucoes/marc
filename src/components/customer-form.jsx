"use client";

import { CheckCircle2, LoaderCircle, UserPlus } from "lucide-react";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { createCustomer, updateCustomer } from "../app/app/clientes/actions";

const initialState = { error: "", success: "" };

function Submit({ editing, active }) {
  const { pending } = useFormStatus();
  return (
    <button className="button button--primary customer-submit" type="submit" disabled={pending}>
      {pending ? <><LoaderCircle className="spin" size={17} /> Salvando</> : <><UserPlus size={17} /> {editing ? (active ? "Salvar alterações" : "Salvar e restaurar") : "Adicionar cliente"}</>}
    </button>
  );
}

export default function CustomerForm({ customer = null }) {
  const editing = Boolean(customer);
  const [state, action] = useActionState(editing ? updateCustomer : createCustomer, initialState);
  const [confirming, setConfirming] = useState(false);
  return (
    <form className="customer-form" action={action}>
      <div className="team-form__heading">
        <h2>{editing ? "Editar cliente" : "Novo cliente"}</h2>
        <p>{editing ? "Mantenha os dados e observações úteis para os próximos atendimentos." : "Cadastre contatos recebidos fora do agendamento online."}</p>
      </div>
      {editing && <input type="hidden" name="customerId" value={customer.id} />}
      <div className="field"><label htmlFor="customerFullName">Nome</label><input id="customerFullName" name="fullName" placeholder="Nome completo" defaultValue={customer?.full_name || ""} maxLength={120} required /></div>
      <div className="field"><label htmlFor="customerPhoneManual">WhatsApp</label><input id="customerPhoneManual" name="phone" type="tel" placeholder="(00) 00000-0000" defaultValue={customer?.phone || ""} required /></div>
      <div className="field"><label htmlFor="customerEmailManual">E-mail <span>opcional</span></label><input id="customerEmailManual" name="email" type="email" placeholder="cliente@email.com" defaultValue={customer?.email || ""} /></div>
      <div className="field"><label htmlFor="customerNotes">Observações <span>opcional</span></label><textarea id="customerNotes" name="notes" rows={3} placeholder="Preferências, alergias ou informações úteis" defaultValue={customer?.notes || ""} maxLength={1000} /></div>
      {state.error && <p className="form-message form-message--error" role="alert">{state.error}</p>}
      {state.success && <div className="form-message form-message--success"><CheckCircle2 size={17} />{state.success}</div>}
      <Submit editing={editing} active={customer?.is_active !== false} />
      {editing && (customer.is_active ? (
        confirming ? (
          <div className="lifecycle-confirm" role="group" aria-label="Confirmar arquivamento">
            <button className="button button--danger" type="submit" name="intent" value="archive">Confirmar arquivamento</button>
            <button className="button button--quiet" type="button" onClick={() => setConfirming(false)}>Manter cliente</button>
          </div>
        ) : <button className="button button--quiet lifecycle-trigger" type="button" onClick={() => setConfirming(true)}>Arquivar cliente</button>
      ) : <button className="button button--secondary" type="submit" name="intent" value="restore">Restaurar cliente</button>)}
    </form>
  );
}

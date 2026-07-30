"use client";

import { ArrowRight, CheckCircle2, LoaderCircle, Scissors } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createService } from "../app/app/servicos/actions";

const initialState = { error: "", success: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button button--primary service-submit" type="submit" disabled={pending}>
      {pending
        ? <><LoaderCircle className="spin" size={18} /> Salvando serviço</>
        : <>Cadastrar serviço <ArrowRight size={18} /></>}
    </button>
  );
}

export default function ServiceForm() {
  const [state, action] = useActionState(createService, initialState);

  return (
    <form className="service-form" action={action}>
      <div className="service-form__heading">
        <div><Scissors size={21} /></div>
        <span>Novo serviço</span>
        <h2>O que você atende?</h2>
        <p>Defina a base agora. Depois cada profissional poderá ajustar disponibilidade e regras.</p>
      </div>
      <div className="field">
        <label htmlFor="serviceName">Nome do serviço</label>
        <input id="serviceName" name="name" placeholder="Ex.: Corte masculino" minLength={2} maxLength={80} required />
      </div>
      <div className="field">
        <label htmlFor="serviceDescription">Descrição <span>opcional</span></label>
        <input id="serviceDescription" name="description" placeholder="Uma frase para orientar o cliente" maxLength={180} />
      </div>
      <div className="field-grid">
        <div className="field">
          <label htmlFor="serviceDuration">Duração</label>
          <select id="serviceDuration" name="duration" defaultValue="30" required>
            <option value="15">15 minutos</option>
            <option value="30">30 minutos</option>
            <option value="45">45 minutos</option>
            <option value="60">1 hora</option>
            <option value="90">1h30</option>
            <option value="120">2 horas</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="servicePrice">Valor</label>
          <div className="money-field"><span>R$</span><input id="servicePrice" name="price" inputMode="decimal" placeholder="50,00" required /></div>
        </div>
      </div>
      {state.error && <p className="form-message form-message--error" role="alert">{state.error}</p>}
      {state.success && (
        <div className="form-message form-message--success" role="status">
          <CheckCircle2 size={18} /><span>{state.success}</span>
        </div>
      )}
      <SubmitButton />
    </form>
  );
}

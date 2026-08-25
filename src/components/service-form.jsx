"use client";

import { ArrowRight, CheckCircle2, LoaderCircle } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { createService } from "../app/app/servicos/actions";
import { useMobileRouteSheetAction } from "./mobile-route-sheet";

const initialState = { error: "", success: "" };

function SubmitButton({ editing }) {
  const { pending } = useFormStatus();
  const setSheetPending = useMobileRouteSheetAction()?.setPending;

  useEffect(() => {
    setSheetPending?.(pending);
    return () => setSheetPending?.(false);
  }, [pending, setSheetPending]);

  return (
    <button className="button button--primary service-submit" type="submit" disabled={pending}>
      {pending
        ? <><LoaderCircle className="spin" size={18} /> Salvando serviço</>
        : <>{editing ? "Salvar alterações" : "Cadastrar serviço"} <ArrowRight size={18} /></>}
    </button>
  );
}

export default function ServiceForm({ service = null, formId = undefined }) {
  const [state, action] = useActionState(createService, initialState);
  const editing = Boolean(service);
  const [confirming, setConfirming] = useState(false);

  return (
    <form className="service-form" id={formId} action={action}>
      <div className="service-form__heading">
        <h2>{editing ? "Editar serviço" : "Novo serviço"}</h2>
        <p>{editing ? "Atualize o valor e a duração usados na sua agenda." : "Defina o serviço, o valor e a duração usados especificamente na sua agenda."}</p>
      </div>
      {editing && <input type="hidden" name="serviceId" value={service.id} />}
      <div className="field">
        <label htmlFor="serviceName">Nome do serviço</label>
        <input id="serviceName" name="name" placeholder="Ex.: Corte masculino" defaultValue={service?.name || ""} minLength={2} maxLength={80} readOnly={editing} required />
      </div>
      {!editing && (
        <div className="field">
          <label htmlFor="serviceDescription">Descrição <span>opcional</span></label>
          <input id="serviceDescription" name="description" placeholder="Uma frase para orientar o cliente" maxLength={180} />
        </div>
      )}
      {editing && <input type="hidden" name="description" value={service?.description || ""} />}
      <div className="field-grid">
        <div className="field">
          <label htmlFor="serviceDuration">Duração</label>
          <select id="serviceDuration" name="duration" defaultValue={String(service?.duration_minutes || 30)} required>
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
          <div className="money-field"><span>R$</span><input id="servicePrice" name="price" inputMode="decimal" defaultValue={service ? (service.price_cents / 100).toFixed(2).replace(".", ",") : ""} placeholder="50,00" required /></div>
        </div>
      </div>
      <div className="service-buffer-fields">
        <div><strong>Tempo entre clientes</strong><span>Reserve um intervalo para preparar e finalizar o atendimento.</span></div>
        <div className="field-grid">
          <div className="field"><label htmlFor="serviceBufferBefore">Antes do serviço</label><select id="serviceBufferBefore" name="bufferBefore" defaultValue={String(service?.buffer_before_minutes || 0)}><option value="0">Sem intervalo</option><option value="5">5 minutos</option><option value="10">10 minutos</option><option value="15">15 minutos</option><option value="30">30 minutos</option><option value="45">45 minutos</option><option value="60">1 hora</option></select></div>
          <div className="field"><label htmlFor="serviceBufferAfter">Depois do serviço</label><select id="serviceBufferAfter" name="bufferAfter" defaultValue={String(service?.buffer_after_minutes || 0)}><option value="0">Sem intervalo</option><option value="5">5 minutos</option><option value="10">10 minutos</option><option value="15">15 minutos</option><option value="30">30 minutos</option><option value="45">45 minutos</option><option value="60">1 hora</option></select></div>
        </div>
      </div>
      {state.error && <p className="form-message form-message--error" role="alert">{state.error}</p>}
      {state.success && (
        <div className="form-message form-message--success" role="status">
          <CheckCircle2 size={18} /><span>{state.success}</span>
        </div>
      )}
      <SubmitButton editing={editing} />
      {editing && (service.is_active ? (
        confirming ? (
          <div className="lifecycle-confirm" role="group" aria-label="Confirmar pausa do serviço">
            <button className="button button--danger" type="submit" name="intent" value="deactivate">Confirmar pausa</button>
            <button className="button button--quiet" type="button" onClick={() => setConfirming(false)}>Manter na agenda</button>
          </div>
        ) : <button className="button button--quiet lifecycle-trigger" type="button" onClick={() => setConfirming(true)}>Pausar na minha agenda</button>
      ) : <button className="button button--secondary" type="submit" name="intent" value="activate">Reativar na minha agenda</button>)}
    </form>
  );
}

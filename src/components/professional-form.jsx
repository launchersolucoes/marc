"use client";

import { ArrowRight, CheckCircle2, LoaderCircle, UserPlus } from "lucide-react";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { createProfessional, updateProfessional } from "../app/app/equipe/actions";

const initialState = { error: "", success: "" };
const colors = ["#ffa500", "#e96b4c", "#59a5d8", "#7f74d8", "#4ea67a"];

function Submit({ editing, active }) {
  const { pending } = useFormStatus();
  return (
    <button className="button button--primary team-form__submit" type="submit" disabled={pending}>
      {pending
        ? <><LoaderCircle className="spin" size={18} /> Salvando</>
        : <>{editing ? (active ? "Salvar alterações" : "Salvar e reativar") : "Adicionar à equipe"} <ArrowRight size={17} /></>}
    </button>
  );
}

export default function ProfessionalForm({ professional = null }) {
  const editing = Boolean(professional);
  const [state, action] = useActionState(editing ? updateProfessional : createProfessional, initialState);
  const [confirming, setConfirming] = useState(false);

  return (
    <form className="team-form" action={action}>
      <div className="team-form__heading">
        <div><UserPlus size={20} /></div>
        <h2>{editing ? "Editar profissional" : "Novo profissional"}</h2>
        <p>{editing ? "Atualize os dados usados pela equipe e na agenda." : "Crie o perfil operacional agora. O acesso individual será conectado por convite em seguida."}</p>
      </div>
      {editing && <input type="hidden" name="professionalId" value={professional.id} />}
      <div className="field">
        <label htmlFor="professionalName">Nome</label>
        <input id="professionalName" name="name" placeholder="Nome de exibição" defaultValue={professional?.display_name || ""} maxLength={90} required />
      </div>
      <div className="field-grid">
        <div className="field">
          <label htmlFor="professionalEmail">E-mail <span>opcional</span></label>
          <input id="professionalEmail" name="email" type="email" placeholder="profissional@email.com" defaultValue={professional?.contact_email || ""} />
        </div>
        <div className="field">
          <label htmlFor="professionalPhone">WhatsApp <span>opcional</span></label>
          <input id="professionalPhone" name="phone" type="tel" inputMode="tel" placeholder="(00) 00000-0000" defaultValue={professional?.contact_phone || ""} />
        </div>
      </div>
      <fieldset className="color-picker">
        <legend>Cor na agenda</legend>
        {colors.map((color, index) => (
          <label key={color} style={{ "--team-color": color }}>
            <input type="radio" name="color" value={color} defaultChecked={professional ? professional.color === color : index === 0} />
            <span />
          </label>
        ))}
      </fieldset>
      {state.error && <p className="form-message form-message--error" role="alert">{state.error}</p>}
      {state.success && <div className="form-message form-message--success"><CheckCircle2 size={17} />{state.success}</div>}
      <Submit editing={editing} active={professional?.is_active !== false} />
      {editing && (professional.is_active ? (
        confirming ? (
          <div className="lifecycle-confirm" role="group" aria-label="Confirmar desativação">
            <button className="button button--danger" type="submit" name="intent" value="deactivate">Confirmar desativação</button>
            <button className="button button--quiet" type="button" onClick={() => setConfirming(false)}>Manter ativo</button>
          </div>
        ) : <button className="button button--quiet lifecycle-trigger" type="button" onClick={() => setConfirming(true)}>Desativar profissional</button>
      ) : <button className="button button--secondary" type="submit" name="intent" value="activate">Reativar profissional</button>)}
    </form>
  );
}

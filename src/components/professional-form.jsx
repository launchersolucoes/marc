"use client";

import { ArrowRight, CheckCircle2, LoaderCircle, UserPlus } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createProfessional } from "../app/app/equipe/actions";

const initialState = { error: "", success: "" };
const colors = ["#ffa500", "#e96b4c", "#59a5d8", "#7f74d8", "#4ea67a"];

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button className="button button--primary team-form__submit" type="submit" disabled={pending}>
      {pending
        ? <><LoaderCircle className="spin" size={18} /> Salvando</>
        : <>Adicionar à equipe <ArrowRight size={17} /></>}
    </button>
  );
}

export default function ProfessionalForm() {
  const [state, action] = useActionState(createProfessional, initialState);

  return (
    <form className="team-form" action={action}>
      <div className="team-form__heading">
        <div><UserPlus size={20} /></div>
        <h2>Novo profissional</h2>
        <p>Crie o perfil operacional agora. O acesso individual será conectado por convite em seguida.</p>
      </div>
      <div className="field">
        <label htmlFor="professionalName">Nome</label>
        <input id="professionalName" name="name" placeholder="Nome de exibição" maxLength={90} required />
      </div>
      <div className="field-grid">
        <div className="field">
          <label htmlFor="professionalEmail">E-mail <span>opcional</span></label>
          <input id="professionalEmail" name="email" type="email" placeholder="profissional@email.com" />
        </div>
        <div className="field">
          <label htmlFor="professionalPhone">WhatsApp <span>opcional</span></label>
          <input id="professionalPhone" name="phone" type="tel" inputMode="tel" placeholder="(00) 00000-0000" />
        </div>
      </div>
      <fieldset className="color-picker">
        <legend>Cor na agenda</legend>
        {colors.map((color, index) => (
          <label key={color} style={{ "--team-color": color }}>
            <input type="radio" name="color" value={color} defaultChecked={index === 0} />
            <span />
          </label>
        ))}
      </fieldset>
      {state.error && <p className="form-message form-message--error" role="alert">{state.error}</p>}
      {state.success && <div className="form-message form-message--success"><CheckCircle2 size={17} />{state.success}</div>}
      <Submit />
    </form>
  );
}

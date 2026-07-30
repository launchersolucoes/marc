"use client";

import { Check, Copy, LoaderCircle, Send } from "lucide-react";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { createInvitation } from "../app/app/equipe/actions";

const initialState = { error: "", success: "", inviteUrl: "" };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button className="button button--primary team-form__submit" type="submit" disabled={pending}>
      {pending ? <><LoaderCircle className="spin" size={17} /> Criando</> : <><Send size={17} /> Criar convite</>}
    </button>
  );
}

export default function InviteForm({ professionals }) {
  const [state, action] = useActionState(createInvitation, initialState);
  const [role, setRole] = useState("receptionist");
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(state.inviteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <form className="team-form invite-form" action={action}>
      <div className="team-form__heading">
        <h2>Convidar acesso</h2>
        <p>Gere um link individual. Ele vale por 7 dias e só funciona para o e-mail informado.</p>
      </div>
      <div className="field">
        <label htmlFor="inviteEmail">E-mail</label>
        <input id="inviteEmail" name="inviteEmail" type="email" placeholder="pessoa@email.com" required />
      </div>
      <div className="field">
        <label htmlFor="inviteRole">Tipo de acesso</label>
        <select id="inviteRole" name="inviteRole" value={role} onChange={(event) => setRole(event.target.value)}>
          <option value="receptionist">Recepção · agenda completa</option>
          <option value="manager">Gerente · operação e equipe</option>
          <option value="professional">Profissional · agenda própria</option>
        </select>
      </div>
      {role === "professional" && (
        <div className="field">
          <label htmlFor="professionalId">Vincular perfil <span>opcional</span></label>
          <select id="professionalId" name="professionalId" defaultValue="">
            <option value="">Criar um novo perfil ao aceitar</option>
            {professionals.map((professional) => (
              <option key={professional.id} value={professional.id}>{professional.display_name}</option>
            ))}
          </select>
        </div>
      )}
      {state.error && <p className="form-message form-message--error" role="alert">{state.error}</p>}
      {state.inviteUrl && (
        <div className="invite-result" role="status">
          <span>{state.success}</span>
          <div>
            <input aria-label="Link do convite" readOnly value={state.inviteUrl} />
            <button type="button" onClick={copyLink} aria-label="Copiar link do convite">
              {copied ? <Check size={17} /> : <Copy size={17} />}
            </button>
          </div>
        </div>
      )}
      <Submit />
    </form>
  );
}

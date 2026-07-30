"use client";

import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
} from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  requestPasswordReset,
  updatePassword,
} from "../app/auth/actions";

const initialState = { error: "", success: "" };

function Submit({ mode }) {
  const { pending } = useFormStatus();
  return (
    <button className="button button--primary auth-submit" type="submit" disabled={pending}>
      {pending ? <><LoaderCircle className="spin" size={17} /> Aguarde</> : <>{mode === "request" ? "Enviar link seguro" : "Salvar nova senha"}<ArrowRight size={17} /></>}
    </button>
  );
}

function PasswordInput({ id, label, name }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="password-field">
        <input id={id} name={name} type={visible ? "text" : "password"} minLength={8} autoComplete="new-password" placeholder="Mínimo de 8 caracteres" required />
        <button type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? "Ocultar senha" : "Mostrar senha"}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button>
      </div>
    </div>
  );
}

export default function PasswordRecoveryForm({ mode }) {
  const [state, action] = useActionState(mode === "request" ? requestPasswordReset : updatePassword, initialState);
  return (
    <form className="auth-form" action={action}>
      {mode === "request" ? (
        <div className="field"><label htmlFor="recoveryEmail">E-mail da conta</label><input id="recoveryEmail" name="email" type="email" autoComplete="email" placeholder="voce@seunegocio.com.br" required /></div>
      ) : (
        <>
          <PasswordInput id="newPassword" label="Nova senha" name="password" />
          <PasswordInput id="passwordConfirmation" label="Repita a nova senha" name="passwordConfirmation" />
        </>
      )}
      {state.error && <p className="form-message form-message--error" role="alert">{state.error}</p>}
      {state.success && <p className="form-message form-message--success" role="status"><CheckCircle2 size={17} />{state.success}</p>}
      <Submit mode={mode} />
      <p className="auth-switch"><Link href="/entrar">Voltar para o login</Link></p>
    </form>
  );
}

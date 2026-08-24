"use client";

import { ArrowRight, CheckCircle2, Eye, EyeOff, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { signIn, signUp } from "../app/auth/actions";
import { createClient } from "../lib/supabase/client";

const initialState = { error: "", success: "" };

function SubmitButton({ mode }) {
  const { pending } = useFormStatus();

  return (
    <button className="button button--primary auth-submit" type="submit" disabled={pending}>
      {pending ? (
        <>
          <LoaderCircle className="spin" size={18} /> Aguarde
        </>
      ) : (
        <>
          {mode === "signup" ? "Criar minha conta" : "Entrar no Marc"}
          <ArrowRight size={18} />
        </>
      )}
    </button>
  );
}

export default function AuthForm({ mode, externalError = "", nextPath = "" }) {
  const action = mode === "signup" ? signUp : signIn;
  const [state, formAction] = useActionState(action, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [oauthError, setOauthError] = useState("");
  const isSignup = mode === "signup";
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

  async function continueWithGoogle() {
    setOauthError("");
    const supabase = createClient();
    const callbackUrl = new URL("/auth/confirm", window.location.origin);
    callbackUrl.searchParams.set("next", nextPath || (isSignup ? "/onboarding" : "/app"));
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl.toString() },
    });
    if (error) setOauthError("Não foi possível iniciar o acesso com Google.");
  }

  return (
    <>
      {googleEnabled && (
        <div className="auth-oauth">
          <button type="button" onClick={continueWithGoogle}><span aria-hidden="true">G</span>{isSignup ? "Criar conta com Google" : "Entrar com Google"}</button>
          <div><span>ou continue com e-mail</span></div>
        </div>
      )}
      <form className="auth-form" action={formAction}>
      {nextPath && <input type="hidden" name="next" value={nextPath} />}
      {isSignup && (
        <div className="field">
          <label htmlFor="fullName">Seu nome</label>
          <input
            id="fullName"
            name="fullName"
            autoComplete="name"
            placeholder="Como podemos chamar você?"
            minLength={2}
            maxLength={90}
            required
          />
        </div>
      )}

      <div className="field">
        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="voce@seunegocio.com.br"
          required
        />
      </div>

      <div className="field">
        <div className="field__label-row">
          <label htmlFor="password">Senha</label>
          {!isSignup && <Link className="auth-forgot" href="/recuperar-senha">Esqueci minha senha</Link>}
        </div>
        <div className="password-field">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete={isSignup ? "new-password" : "current-password"}
            placeholder={isSignup ? "Crie uma senha segura" : "Digite sua senha"}
            minLength={8}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {(state.error || externalError || oauthError) && (
        <p className="form-message form-message--error" role="alert">
          {state.error || externalError || oauthError}
        </p>
      )}

      {state.success && (
        <div className="form-message form-message--success" role="status">
          <CheckCircle2 size={18} />
          <span>{state.success}</span>
        </div>
      )}

      <SubmitButton mode={mode} />

      {isSignup && (
        <p className="auth-legal-note">
          Ao criar sua conta, você concorda com os <Link href="/termos" target="_blank" rel="noreferrer">Termos de Uso</Link> e declara que leu a <Link href="/privacidade" target="_blank" rel="noreferrer">Política de Privacidade</Link>.
        </p>
      )}

      <p className="auth-switch">
        {isSignup ? "Já possui uma conta?" : "Ainda não possui uma conta?"}{" "}
        <Link href={`${isSignup ? "/entrar" : "/cadastro"}${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`}>
          {isSignup ? "Entrar" : "Começar teste"}
        </Link>
      </p>
      </form>
    </>
  );
}

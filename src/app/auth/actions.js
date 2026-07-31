"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "../../lib/supabase/server";

const initialState = { error: "", success: "" };

function value(formData, name) {
  return String(formData.get(name) || "").trim();
}

function safeNext(formData, fallback) {
  const requested = value(formData, "next");
  return requested.startsWith("/") && !requested.startsWith("//") ? requested : fallback;
}

export async function signIn(_previousState = initialState, formData) {
  const email = value(formData, "email").toLowerCase();
  const password = value(formData, "password");

  if (!email || !password) {
    return { error: "Informe seu e-mail e sua senha.", success: "" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return {
      error: "Não foi possível entrar. Confira o e-mail e a senha e tente novamente.",
      success: "",
    };
  }

  const requestedNext = value(formData, "next");
  if (!requestedNext) {
    const { data: isPlatformAdmin } = await supabase.rpc("is_platform_admin");
    if (isPlatformAdmin) redirect("/master");
  }

  redirect(safeNext(formData, "/app"));
}

export async function signUp(_previousState = initialState, formData) {
  const fullName = value(formData, "fullName");
  const email = value(formData, "email").toLowerCase();
  const password = value(formData, "password");
  const next = safeNext(formData, "/onboarding");

  if (fullName.length < 2) {
    return { error: "Informe seu nome completo.", success: "" };
  }

  if (!email || password.length < 8) {
    return {
      error: "Use um e-mail válido e uma senha com pelo menos 8 caracteres.",
      success: "",
    };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const confirmationUrl = new URL("/auth/confirm", siteUrl);
  confirmationUrl.searchParams.set("next", next);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: confirmationUrl.toString(),
    },
  });

  if (error) {
    return {
      error:
        error.message.toLowerCase().includes("already")
          ? "Este e-mail já possui uma conta. Entre com sua senha."
          : "Não foi possível criar a conta agora. Tente novamente em instantes.",
      success: "",
    };
  }

  if (data.session) {
    const { data: isPlatformAdmin } = await supabase.rpc("is_platform_admin");
    redirect(isPlatformAdmin ? "/master" : next);
  }

  return {
    error: "",
    success: "Conta criada. Confira seu e-mail para confirmar o acesso ao Marc.",
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/entrar");
}

export async function requestPasswordReset(_previousState = initialState, formData) {
  const email = value(formData, "email").toLowerCase();
  if (!email.includes("@")) return { error: "Informe um e-mail válido.", success: "" };

  const supabase = await createClient();
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const confirmationUrl = new URL("/auth/confirm", origin);
  confirmationUrl.searchParams.set("next", "/nova-senha");

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: confirmationUrl.toString(),
  });

  if (error) return { error: "Não foi possível enviar a recuperação agora. Aguarde um instante e tente novamente.", success: "" };
  return { error: "", success: "Se o e-mail estiver cadastrado, você receberá um link para criar uma nova senha." };
}

export async function updatePassword(_previousState = initialState, formData) {
  const password = value(formData, "password");
  const confirmation = value(formData, "passwordConfirmation");
  if (password.length < 8) return { error: "Use uma senha com pelo menos 8 caracteres.", success: "" };
  if (password !== confirmation) return { error: "As senhas informadas não são iguais.", success: "" };

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/entrar?erro=Abra novamente o link de recuperação.");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "Não foi possível atualizar a senha. Solicite um novo link e tente novamente.", success: "" };
  redirect("/app/configuracoes?senha=alterada");
}

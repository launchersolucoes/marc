"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

const initialState = { error: "", success: "" };

function value(formData, name) {
  return String(formData.get(name) || "").trim();
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

  redirect("/app");
}

export async function signUp(_previousState = initialState, formData) {
  const fullName = value(formData, "fullName");
  const email = value(formData, "email").toLowerCase();
  const password = value(formData, "password");

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
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: siteUrl,
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

  if (data.session) redirect("/onboarding");

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

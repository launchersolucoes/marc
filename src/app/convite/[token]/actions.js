"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

export async function acceptInvitation(formData) {
  const token = String(formData.get("token") || "");
  if (!/^[0-9a-f-]{36}$/i.test(token)) redirect(`/convite/${token}?erro=Convite inválido.`);

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect(`/entrar?next=${encodeURIComponent(`/convite/${token}`)}`);

  const { error } = await supabase.rpc("accept_team_invitation", {
    invitation_token: token,
  });

  if (error) {
    const message = error.message.toLowerCase().includes("another email")
      ? "Entre com o mesmo e-mail que recebeu o convite."
      : "Este convite expirou ou já foi utilizado.";
    redirect(`/convite/${token}?erro=${encodeURIComponent(message)}`);
  }

  redirect("/app");
}

"use server";

import { redirect } from "next/navigation";
import { currentLegalDocuments } from "../../../lib/legal-documents";
import { createClient } from "../../../lib/supabase/server";

export async function acceptInvitation(formData) {
  const token = String(formData.get("token") || "");
  if (!/^[0-9a-f-]{36}$/i.test(token)) redirect(`/convite/${token}?erro=Convite inválido.`);
  if (formData.get("legalAcceptance") !== "on") {
    redirect(`/convite/${token}?erro=${encodeURIComponent("Leia e aceite os documentos vigentes para entrar na equipe.")}`);
  }

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect(`/entrar?next=${encodeURIComponent(`/convite/${token}`)}`);

  const { error } = await supabase.rpc("accept_team_invitation", {
    invitation_token: token,
    terms_version: currentLegalDocuments.terms.version,
    terms_content_sha256: currentLegalDocuments.terms.contentSha256,
    privacy_version: currentLegalDocuments.privacy.version,
    privacy_content_sha256: currentLegalDocuments.privacy.contentSha256,
    acceptance_confirmed: true,
  });

  if (error) {
    const message = error.message.toLowerCase().includes("another email")
      ? "Entre com o mesmo e-mail que recebeu o convite."
      : "Este convite expirou ou já foi utilizado.";
    redirect(`/convite/${token}?erro=${encodeURIComponent(message)}`);
  }

  redirect("/app");
}

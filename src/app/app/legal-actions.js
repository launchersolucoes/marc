"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getActionContext } from "../../lib/action-context";
import { currentLegalDocuments } from "../../lib/legal-documents";

export async function recordLegalReconsent(_previousState, formData) {
  if (formData.get("legalAcceptance") !== "on") {
    return { error: "Confirme a leitura dos documentos para continuar." };
  }

  const { supabase, membership } = await getActionContext({
    allowRestricted: true,
    allowLegalPending: true,
  });
  const { error } = await supabase.rpc("record_reconsent_legal_acceptance", {
    terms_version: currentLegalDocuments.terms.version,
    terms_content_sha256: currentLegalDocuments.terms.contentSha256,
    privacy_version: currentLegalDocuments.privacy.version,
    privacy_content_sha256: currentLegalDocuments.privacy.contentSha256,
    target_establishment_id: membership.establishment_id,
    acceptance_confirmed: true,
  });

  if (error) {
    return {
      error: error.message.toLowerCase().includes("version changed")
        ? "Os documentos foram atualizados novamente. Recarregue a página para conferir as versões vigentes."
        : "Não foi possível registrar o aceite. Tente novamente ou fale com o suporte.",
    };
  }

  revalidatePath("/app", "layout");
  redirect("/app?legal=accepted");
}

"use server";

import { redirect } from "next/navigation";
import { currentLegalDocuments } from "../../lib/legal-documents";
import { createClient } from "../../lib/supabase/server";

function value(formData, name) {
  return String(formData.get(name) || "").trim();
}

function slugify(name) {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 42);
  return `${base || "estabelecimento"}-${crypto.randomUUID().slice(0, 6)}`;
}

export async function createEstablishment(_previousState, formData) {
  const name = value(formData, "businessName");
  const phone = value(formData, "phone");
  const category = value(formData, "category");
  const legalAcceptance = formData.get("legalAcceptance") === "on";

  if (name.length < 2 || phone.length < 8 || !category) {
    return {
      error: "Preencha nome, categoria e telefone para continuar.",
    };
  }

  if (!legalAcceptance) {
    return { error: "Leia e aceite os documentos vigentes para criar o estabelecimento." };
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) redirect("/entrar");

  const { error } = await supabase.rpc("onboard_establishment", {
    terms_version: currentLegalDocuments.terms.version,
    terms_content_sha256: currentLegalDocuments.terms.contentSha256,
    privacy_version: currentLegalDocuments.privacy.version,
    privacy_content_sha256: currentLegalDocuments.privacy.contentSha256,
    acceptance_confirmed: true,
    establishment_name: name,
    establishment_slug: slugify(name),
    establishment_phone: phone,
    establishment_email: authData.user.email,
    establishment_category: category,
    establishment_address: value(formData, "address"),
    establishment_city: value(formData, "city"),
    establishment_state: value(formData, "state").toUpperCase(),
    owner_works_here: formData.get("worksHere") === "on",
  });

  if (error) {
    return {
      error: "Não foi possível salvar o estabelecimento. Tente novamente.",
    };
  }

  redirect("/app");
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getActionContext } from "../../../lib/action-context";
import { currentLegalDocuments } from "../../../lib/legal-documents";

function value(formData, name) {
  return String(formData.get(name) || "").trim();
}

export async function updateEstablishment(_previousState, formData) {
  const { supabase, membership } = await getActionContext();
  if (!["owner", "manager"].includes(membership.role)) {
    return { error: "Seu acesso não permite alterar os dados do estabelecimento.", success: "" };
  }

  const name = value(formData, "name");
  const phone = value(formData, "phone");
  const category = value(formData, "category");
  const state = value(formData, "state").toUpperCase();
  const categories = ["barbershop", "salon", "nail_studio", "beauty_studio", "other"];

  if (name.length < 2 || phone.length < 8 || !categories.includes(category)) {
    return { error: "Revise nome, categoria e telefone do estabelecimento.", success: "" };
  }

  if (state && state.length !== 2) {
    return { error: "Informe a UF com duas letras.", success: "" };
  }

  const { error } = await supabase
    .from("establishments")
    .update({
      name,
      category,
      phone,
      email: value(formData, "email").toLowerCase() || null,
      address_line: value(formData, "addressLine") || null,
      address_number: value(formData, "addressNumber") || null,
      address_complement: value(formData, "addressComplement") || null,
      neighborhood: value(formData, "neighborhood") || null,
      city: value(formData, "city") || null,
      state: state || null,
      postal_code: value(formData, "postalCode") || null,
    })
    .eq("id", membership.establishment_id);

  if (error) return { error: "Não foi possível salvar os dados do estabelecimento.", success: "" };

  revalidatePath("/app");
  revalidatePath("/app/configuracoes");
  revalidatePath("/agendar/[slug]", "page");
  return { error: "", success: "Dados do estabelecimento atualizados." };
}

export async function updateProfile(_previousState, formData) {
  const { supabase, user } = await getActionContext();
  const fullName = value(formData, "fullName");
  const phone = value(formData, "profilePhone");

  if (fullName.length < 2) {
    return { error: "Informe seu nome completo.", success: "" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, phone: phone || null })
    .eq("id", user.id);

  if (error) return { error: "Não foi possível atualizar seu perfil.", success: "" };

  const { error: authError } = await supabase.auth.updateUser({
    data: { ...user.user_metadata, full_name: fullName },
  });

  if (authError) return { error: "O perfil foi salvo, mas o nome da sessão não pôde ser atualizado.", success: "" };

  revalidatePath("/app");
  revalidatePath("/app/configuracoes");
  return { error: "", success: "Seu perfil foi atualizado." };
}

export async function updateBookingRules(_previousState, formData) {
  const minimumNotice = Number(value(formData, "minimumNotice"));
  const maximumDays = Number(value(formData, "maximumDays"));
  const cancellationWindow = Number(value(formData, "cancellationWindow"));
  const confirmationMode = value(formData, "confirmationMode");

  if (!Number.isInteger(minimumNotice) || !Number.isInteger(maximumDays)
    || !Number.isInteger(cancellationWindow) || !["automatic", "manual"].includes(confirmationMode)) {
    return { error: "Revise as regras de agendamento.", success: "" };
  }

  const { supabase, membership } = await getActionContext();
  if (!["owner", "manager"].includes(membership.role)) {
    return { error: "Seu acesso não permite alterar as regras da agenda.", success: "" };
  }

  const { error } = await supabase.rpc("update_booking_rules", {
    minimum_notice_minutes: minimumNotice,
    maximum_booking_days: maximumDays,
    cancellation_window_minutes: cancellationWindow,
    confirmation_mode: confirmationMode,
  });
  if (error) return { error: "Não foi possível salvar as regras da agenda.", success: "" };

  revalidatePath("/app/configuracoes");
  revalidatePath("/agendar/[slug]", "page");
  return { error: "", success: "Regras atualizadas. Os próximos horários já seguem esta política." };
}

export async function recordLegalAcceptance(formData) {
  if (formData.get("legalAcceptance") !== "on") {
    redirect("/app/configuracoes?legal=required");
  }

  const { supabase, membership } = await getActionContext({ allowRestricted: true });
  const { error } = await supabase.rpc("record_settings_legal_acceptance", {
    terms_version: currentLegalDocuments.terms.version,
    terms_content_sha256: currentLegalDocuments.terms.contentSha256,
    privacy_version: currentLegalDocuments.privacy.version,
    privacy_content_sha256: currentLegalDocuments.privacy.contentSha256,
    target_establishment_id: membership.establishment_id,
    acceptance_confirmed: true,
  });

  if (error) redirect("/app/configuracoes?legal=error");

  revalidatePath("/app/configuracoes");
  redirect("/app/configuracoes?legal=accepted");
}

export async function requestOwnDataDeletion(_previousState, formData) {
  const details = value(formData, "details");
  const { supabase } = await getActionContext({ allowRestricted: true });
  const { error } = await supabase.rpc("request_own_data_deletion", {
    request_details: details || null,
  });

  if (error) {
    const message = error.message.toLowerCase();
    return {
      error: message.includes("already open")
        ? "Você já possui uma solicitação de exclusão em análise."
        : "Não foi possível registrar a solicitação. Tente novamente ou fale com o suporte.",
      success: "",
    };
  }

  return {
    error: "",
    success: "Solicitação registrada. O suporte analisará vínculos e prazos de retenção antes da exclusão.",
  };
}

export async function closeEstablishment(_previousState, formData) {
  const confirmation = value(formData, "confirmation");
  const acknowledged = value(formData, "acknowledged") === "yes";
  if (!acknowledged) {
    return { error: "Confirme que você baixou os dados necessários antes de encerrar.", success: "" };
  }

  const { supabase, membership } = await getActionContext({ allowRestricted: true });
  if (membership.role !== "owner") {
    return { error: "Somente o proprietário pode encerrar o estabelecimento.", success: "" };
  }

  const { error } = await supabase.rpc("close_current_establishment", {
    confirmation_slug: confirmation,
  });
  if (error) {
    const message = error.message.toLowerCase();
    return {
      error: message.includes("billing subscription")
        ? "Cancele primeiro a assinatura ativa na área de Plano e assinatura."
        : message.includes("confirmation")
        ? "O identificador informado não corresponde ao estabelecimento."
        : "Não foi possível concluir o encerramento. Nenhum acesso foi alterado; fale com o suporte.",
      success: "",
    };
  }

  await supabase.auth.signOut();
  redirect("/entrar?encerrado=1");
}

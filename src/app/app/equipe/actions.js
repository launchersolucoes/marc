"use server";

import { revalidatePath } from "next/cache";
import { getActionContext } from "../../../lib/action-context";
import { sendTransactionalEmail } from "../../../lib/email";
import { buildInvitationEmail } from "../../../lib/email-template";

function value(formData, name) {
  return String(formData.get(name) || "").trim();
}

export async function createProfessional(_previousState, formData) {
  const name = value(formData, "name");
  const email = value(formData, "email");
  const phone = value(formData, "phone");
  const color = value(formData, "color") || "#ffa500";

  if (name.length < 2) return { error: "Informe o nome do profissional.", success: "" };

  const { supabase, membership } = await getActionContext();

  if (!["owner", "manager"].includes(membership.role)) {
    return { error: "Somente dono ou gerente pode cadastrar profissionais.", success: "" };
  }

  const { error } = await supabase.rpc("create_professional_profile", {
    target_establishment_id: membership.establishment_id,
    professional_name: name,
    professional_email: email,
    professional_phone: phone,
    professional_color: color,
  });

  if (error) return { error: "Não foi possível cadastrar esse profissional.", success: "" };

  revalidatePath("/app/equipe");
  revalidatePath("/app");
  revalidatePath("/agendar", "layout");
  return { error: "", success: `${name} já aparece na equipe.` };
}

export async function updateProfessional(_previousState, formData) {
  const professionalId = value(formData, "professionalId");
  const name = value(formData, "name");
  const email = value(formData, "email");
  const phone = value(formData, "phone");
  const color = value(formData, "color") || "#ffa500";
  const intent = value(formData, "intent") || "save";

  if (!professionalId || name.length < 2 || name.length > 90) {
    return { error: "Informe um nome válido para o profissional.", success: "" };
  }

  const { supabase, membership } = await getActionContext();
  if (!["owner", "manager"].includes(membership.role)) {
    return { error: "Somente dono ou gerente pode editar profissionais.", success: "" };
  }

  const { error } = await supabase.rpc("update_professional_profile", {
    target_professional_id: professionalId,
    professional_name: name,
    professional_email: email,
    professional_phone: phone,
    professional_color: color,
    professional_active: intent === "deactivate" ? false : true,
  });

  if (error) {
    return {
      error: error.message.toLowerCase().includes("future appointments")
        ? "Esse profissional ainda possui atendimentos futuros. Reagende ou cancele esses horários antes de desativá-lo."
        : "Não foi possível atualizar esse profissional.",
      success: "",
    };
  }
  revalidatePath("/app/equipe");
  revalidatePath("/app");
  revalidatePath("/agendar", "layout");
  return {
    error: "",
    success: intent === "deactivate"
      ? "Profissional desativado sem perder o histórico."
      : intent === "activate" ? "Profissional reativado." : "Perfil profissional atualizado.",
  };
}

export async function createInvitation(_previousState, formData) {
  const email = value(formData, "inviteEmail").toLowerCase();
  const role = value(formData, "inviteRole");
  const professionalId = value(formData, "professionalId") || null;

  if (!email.includes("@") || !["manager", "receptionist", "professional"].includes(role)) {
    return { error: "Informe um e-mail e um tipo de acesso válidos.", success: "", inviteUrl: "" };
  }

  const { supabase, membership } = await getActionContext();

  if (!membership || !["owner", "manager"].includes(membership.role)) {
    return { error: "Somente dono ou gerente pode criar convites.", success: "", inviteUrl: "" };
  }

  const { data: token, error } = await supabase.rpc("create_team_invitation", {
    target_establishment_id: membership.establishment_id,
    invite_email: email,
    invite_role: role,
    target_professional_id: role === "professional" ? professionalId : null,
  });

  if (error || !token) {
    return { error: "Não foi possível criar esse convite. Revise os dados e tente novamente.", success: "", inviteUrl: "" };
  }

  revalidatePath("/app/equipe");
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const inviteUrl = `${siteUrl}/convite/${token}`;
  const { data: establishment } = await supabase
    .from("establishments")
    .select("name")
    .eq("id", membership.establishment_id)
    .single();
  const message = buildInvitationEmail({
    establishmentName: establishment?.name || "sua equipe",
    role,
    inviteUrl,
  });
  const delivery = await sendTransactionalEmail({ to: email, ...message });

  return {
    error: "",
    success: delivery.sent
      ? "Convite enviado por e-mail. O link também está disponível abaixo."
      : "Convite pronto para compartilhar.",
    inviteUrl,
  };
}

export async function revokeInvitation(_previousState, formData) {
  const invitationId = value(formData, "invitationId");
  const { supabase, membership } = await getActionContext();
  if (!["owner", "manager"].includes(membership.role)) {
    return { error: "Somente dono ou gerente pode revogar convites.", success: "" };
  }

  const { error } = await supabase.rpc("revoke_team_invitation", { target_invitation_id: invitationId });
  if (error) return { error: "Não foi possível revogar esse convite.", success: "" };
  revalidatePath("/app/equipe");
  return { error: "", success: "Convite revogado." };
}

export async function renewInvitation(_previousState, formData) {
  const invitationId = value(formData, "invitationId");
  const { supabase, membership } = await getActionContext();
  if (!["owner", "manager"].includes(membership.role)) {
    return { error: "Somente dono ou gerente pode renovar convites.", success: "", inviteUrl: "" };
  }

  const { data: invitation } = await supabase
    .from("establishment_invitations")
    .select("email, role, professional_id")
    .eq("id", invitationId)
    .eq("establishment_id", membership.establishment_id)
    .eq("status", "pending")
    .maybeSingle();
  if (!invitation) return { error: "Esse convite não está mais disponível.", success: "", inviteUrl: "" };

  const { data: token, error } = await supabase.rpc("create_team_invitation", {
    target_establishment_id: membership.establishment_id,
    invite_email: invitation.email,
    invite_role: invitation.role,
    target_professional_id: invitation.role === "professional" ? invitation.professional_id : null,
  });
  if (error || !token) return { error: "Não foi possível renovar esse convite.", success: "", inviteUrl: "" };

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const inviteUrl = `${siteUrl}/convite/${token}`;
  const { data: establishment } = await supabase
    .from("establishments")
    .select("name")
    .eq("id", membership.establishment_id)
    .single();
  const message = buildInvitationEmail({ establishmentName: establishment?.name || "sua equipe", role: invitation.role, inviteUrl });
  const delivery = await sendTransactionalEmail({ to: invitation.email, ...message });

  revalidatePath("/app/equipe");
  return {
    error: "",
    success: delivery.sent ? "Novo convite enviado." : "Novo link de convite criado.",
    inviteUrl,
  };
}

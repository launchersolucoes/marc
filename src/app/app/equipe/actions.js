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
  return { error: "", success: `${name} já aparece na equipe.` };
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

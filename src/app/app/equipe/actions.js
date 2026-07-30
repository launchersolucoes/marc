"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

function value(formData, name) {
  return String(formData.get(name) || "").trim();
}

export async function createProfessional(_previousState, formData) {
  const name = value(formData, "name");
  const email = value(formData, "email");
  const phone = value(formData, "phone");
  const color = value(formData, "color") || "#ffa500";

  if (name.length < 2) return { error: "Informe o nome do profissional.", success: "" };

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/entrar");

  const { data: membership } = await supabase
    .from("establishment_memberships")
    .select("establishment_id, role")
    .eq("user_id", authData.user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (!membership) redirect("/onboarding");

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

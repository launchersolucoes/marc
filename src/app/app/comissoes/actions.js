"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

export async function updateCommission(_previousState, formData) {
  const professionalId = String(formData.get("professionalId") || "");
  const rawPercent = String(formData.get("commissionPercent") || "").replace(",", ".");
  const commissionPercent = Number(rawPercent);

  if (!professionalId || !Number.isFinite(commissionPercent) || commissionPercent < 0 || commissionPercent > 100) {
    return { error: "Informe uma comissão entre 0% e 100%.", success: "" };
  }

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/entrar");

  const { error } = await supabase.rpc("update_professional_commission", {
    target_professional_id: professionalId,
    new_commission_percent: commissionPercent,
  });

  if (error) {
    return { error: "Não foi possível atualizar a comissão. Confirme seu acesso e tente novamente.", success: "" };
  }

  revalidatePath("/app/comissoes");
  revalidatePath("/app/equipe");
  return { error: "", success: "Comissão atualizada para os próximos atendimentos." };
}


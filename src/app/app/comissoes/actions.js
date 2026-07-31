"use server";

import { revalidatePath } from "next/cache";
import { getActionContext } from "../../../lib/action-context";

export async function updateCommission(_previousState, formData) {
  const professionalId = String(formData.get("professionalId") || "");
  const rawPercent = String(formData.get("commissionPercent") || "").replace(",", ".");
  const commissionPercent = Number(rawPercent);

  if (!professionalId || !Number.isFinite(commissionPercent) || commissionPercent < 0 || commissionPercent > 100) {
    return { error: "Informe uma comissão entre 0% e 100%.", success: "" };
  }

  const { supabase } = await getActionContext();

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

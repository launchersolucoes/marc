"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPlatformAdminContext } from "../../lib/platform-admin-context";
import { normalizeSubscriptionCommand } from "../../lib/platform-admin";

function field(formData, name) {
  return String(formData.get(name) || "").trim();
}

export async function updateEstablishmentSubscription(formData) {
  const { supabase } = await getPlatformAdminContext();
  const command = normalizeSubscriptionCommand({
    establishmentId: field(formData, "establishmentId"),
    planCode: field(formData, "planCode"),
    status: field(formData, "status"),
    accessDays: field(formData, "accessDays"),
  });

  if (!command) redirect("/master?erro=Revise+os+dados+da+assinatura");

  const { error } = await supabase.rpc("admin_update_establishment_subscription", {
    target_establishment_id: command.establishmentId,
    desired_plan: command.planCode,
    desired_status: command.status,
    access_days: command.accessDays,
  });

  if (error) redirect("/master?erro=Nao+foi+possivel+atualizar+a+assinatura");
  revalidatePath("/master");
  redirect("/master?atualizado=1");
}

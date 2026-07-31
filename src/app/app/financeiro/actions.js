"use server";

import { revalidatePath } from "next/cache";
import { getActionContext } from "../../../lib/action-context";

function value(formData, name) {
  return String(formData.get(name) || "").trim();
}

export async function createExpense(_previousState, formData) {
  const { supabase, membership } = await getActionContext();

  if (!membership || !["owner", "manager"].includes(membership.role)) {
    return { error: "Seu acesso não permite lançar despesas.", success: "" };
  }

  const amount = Number(value(formData, "amount").replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0 || value(formData, "description").length < 2) {
    return { error: "Informe uma descrição e um valor válido.", success: "" };
  }

  const { error } = await supabase.rpc("create_financial_expense", {
    target_establishment_id: membership.establishment_id,
    expense_description: value(formData, "description"),
    expense_category: value(formData, "category"),
    expense_amount_cents: Math.round(amount * 100),
    expense_payment_method: value(formData, "paymentMethod"),
    local_occurred_at: value(formData, "occurredAt"),
  });

  if (error) return { error: "Não foi possível registrar essa despesa.", success: "" };
  revalidatePath("/app/financeiro");
  return { error: "", success: "Despesa registrada no caixa." };
}

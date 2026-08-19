"use server";

import { revalidatePath } from "next/cache";
import { getActionContext } from "../../../lib/action-context";

function value(formData, name) {
  return String(formData.get(name) || "").trim();
}

function cents(formData, name) {
  const amount = Number(value(formData, name).replace(",", "."));
  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) : null;
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

export async function updateExpense(_previousState, formData) {
  const { supabase, membership } = await getActionContext();

  if (!membership || !["owner", "manager"].includes(membership.role)) {
    return { error: "Seu acesso não permite corrigir despesas.", success: "" };
  }

  const expenseId = value(formData, "expenseId");
  const intent = value(formData, "intent") || "save";
  if (!expenseId) return { error: "Essa despesa não foi encontrada.", success: "" };

  if (intent === "void") {
    const reason = value(formData, "voidReason");
    if (reason.length < 3 || reason.length > 240) {
      return { error: "Explique o motivo do estorno em pelo menos 3 caracteres.", success: "" };
    }

    const { error } = await supabase.rpc("void_manual_financial_expense", {
      target_entry_id: expenseId,
      reason,
    });
    if (error) {
      const message = error.message.toLowerCase();
      return {
        error: message.includes("already voided")
          ? "Essa despesa já foi estornada."
          : message.includes("only manual")
            ? "Entradas de atendimentos não podem ser alteradas manualmente."
            : "Não foi possível estornar essa despesa.",
        success: "",
      };
    }

    revalidatePath("/app/financeiro");
    return { error: "", success: "Despesa estornada. O lançamento permanece no histórico sem afetar o saldo." };
  }

  const description = value(formData, "description");
  const amount = Number(value(formData, "amount").replace(",", "."));
  if (description.length < 2 || description.length > 160 || !Number.isFinite(amount) || amount <= 0) {
    return { error: "Informe uma descrição e um valor válido.", success: "" };
  }

  const { error } = await supabase.rpc("update_manual_financial_expense", {
    target_entry_id: expenseId,
    expense_description: description,
    expense_category: value(formData, "category"),
    expense_amount_cents: Math.round(amount * 100),
    expense_payment_method: value(formData, "paymentMethod"),
    local_occurred_at: value(formData, "occurredAt"),
  });

  if (error) {
    const message = error.message.toLowerCase();
    return {
      error: message.includes("voided")
        ? "Despesas estornadas não podem mais ser editadas."
        : message.includes("only manual")
          ? "Entradas de atendimentos não podem ser alteradas manualmente."
          : "Não foi possível salvar essa correção.",
      success: "",
    };
  }

  revalidatePath("/app/financeiro");
  return { error: "", success: "Despesa atualizada e alteração registrada no histórico." };
}

export async function closeFinancialDay(_previousState, formData) {
  const { supabase, membership } = await getActionContext();
  if (!membership || !["owner", "manager"].includes(membership.role)) {
    return { error: "Seu acesso não permite fechar o caixa.", success: "" };
  }

  const declared = {
    cash: cents(formData, "cash"),
    pix: cents(formData, "pix"),
    creditCard: cents(formData, "creditCard"),
    debitCard: cents(formData, "debitCard"),
    other: cents(formData, "other"),
  };
  if (Object.values(declared).some((amount) => amount === null)) {
    return { error: "Revise os valores conferidos. Nenhum deles pode ser negativo.", success: "" };
  }

  const businessDate = value(formData, "businessDate");
  const { error } = await supabase.rpc("close_financial_day", {
    target_establishment_id: membership.establishment_id,
    target_business_date: businessDate,
    declared_cash_cents: declared.cash,
    declared_pix_cents: declared.pix,
    declared_credit_card_cents: declared.creditCard,
    declared_debit_card_cents: declared.debitCard,
    declared_other_cents: declared.other,
    closing_notes: value(formData, "notes"),
  });

  if (error) {
    return {
      error: error.message.toLowerCase().includes("already closed")
        ? "Esse dia já foi fechado. Reabra-o antes de fazer uma nova conferência."
        : "Não foi possível concluir o fechamento. Revise os valores e tente novamente.",
      success: "",
    };
  }

  revalidatePath("/app/financeiro");
  return { error: "", success: "Caixa fechado. As diferenças ficaram registradas no histórico." };
}

export async function reopenFinancialDay(_previousState, formData) {
  const { supabase, membership } = await getActionContext();
  if (!membership || !["owner", "manager"].includes(membership.role)) {
    return { error: "Seu acesso não permite reabrir o caixa.", success: "" };
  }

  const reason = value(formData, "reason");
  if (reason.length < 3 || reason.length > 240) {
    return { error: "Explique o motivo da reabertura em pelo menos 3 caracteres.", success: "" };
  }

  const { error } = await supabase.rpc("reopen_financial_day", {
    target_closing_id: value(formData, "closingId"),
    reason,
  });
  if (error) return { error: "Não foi possível reabrir esse fechamento.", success: "" };

  revalidatePath("/app/financeiro");
  return { error: "", success: "Caixa reaberto. Faça uma nova conferência quando estiver pronto." };
}

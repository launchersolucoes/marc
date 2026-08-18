"use server";

import { revalidatePath } from "next/cache";
import { getActionContext } from "../../../lib/action-context";
import { isValidPhone, normalizePhone } from "../../../lib/phone";

function value(formData, name) {
  return String(formData.get(name) || "").trim();
}

export async function createCustomer(_previousState, formData) {
  const fullName = value(formData, "fullName");
  const phone = normalizePhone(value(formData, "phone"));
  const email = value(formData, "email").toLowerCase();
  const notes = value(formData, "notes");

  if (fullName.length < 2 || !isValidPhone(phone)) {
    return { error: "Informe o nome e um telefone válido.", success: "" };
  }

  const { supabase, membership } = await getActionContext();

  if (!["owner", "manager", "receptionist"].includes(membership.role)) {
    return { error: "Seu acesso permite consultar clientes da sua agenda, mas não criar contatos.", success: "" };
  }

  const { data: existing } = await supabase
    .from("customers")
    .select("id")
    .eq("establishment_id", membership.establishment_id)
    .eq("phone", phone)
    .maybeSingle();
  if (existing) return { error: "Já existe um cliente com esse telefone.", success: "" };

  const { error } = await supabase.from("customers").insert({
    establishment_id: membership.establishment_id,
    full_name: fullName,
    phone,
    email: email || null,
    notes: notes || null,
  });
  if (error) return { error: "Não foi possível salvar esse cliente.", success: "" };

  revalidatePath("/app/clientes");
  return { error: "", success: `${fullName} entrou na sua base de clientes.` };
}

export async function updateCustomer(_previousState, formData) {
  const customerId = value(formData, "customerId");
  const fullName = value(formData, "fullName");
  const phone = normalizePhone(value(formData, "phone"));
  const email = value(formData, "email").toLowerCase();
  const notes = value(formData, "notes");
  const intent = value(formData, "intent") || "save";

  if (!customerId || fullName.length < 2 || !isValidPhone(phone)) {
    return { error: "Informe o nome e um telefone válido.", success: "" };
  }

  const { supabase, membership } = await getActionContext();
  if (!["owner", "manager", "receptionist"].includes(membership.role)) {
    return { error: "Seu acesso permite consultar, mas não editar clientes.", success: "" };
  }

  const { error } = await supabase.rpc("update_customer_record", {
    target_customer_id: customerId,
    customer_name: fullName,
    customer_phone: phone,
    customer_email: email,
    customer_notes: notes,
    customer_active: intent === "archive" ? false : true,
  });
  if (error) {
    const message = error.message.toLowerCase();
    return {
      error: message.includes("phone already exists")
        ? "Já existe outro cliente com esse telefone."
        : message.includes("future appointments")
          ? "Esse cliente possui atendimentos futuros. Reagende ou cancele esses horários antes de arquivá-lo."
        : "Não foi possível atualizar esse cliente.",
      success: "",
    };
  }

  revalidatePath("/app/clientes");
  return {
    error: "",
    success: intent === "archive"
      ? "Cliente arquivado. O histórico foi preservado."
      : intent === "restore" ? "Cliente restaurado." : "Dados do cliente atualizados.",
  };
}

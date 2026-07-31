"use server";

import { revalidatePath } from "next/cache";
import { getActionContext } from "../../../lib/action-context";

function value(formData, name) {
  return String(formData.get(name) || "").trim();
}

export async function createCustomer(_previousState, formData) {
  const fullName = value(formData, "fullName");
  const phone = value(formData, "phone");
  const email = value(formData, "email").toLowerCase();
  const notes = value(formData, "notes");

  if (fullName.length < 2 || phone.length < 8) {
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

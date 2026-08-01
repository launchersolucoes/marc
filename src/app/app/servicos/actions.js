"use server";

import { revalidatePath } from "next/cache";
import { getActionContext } from "../../../lib/action-context";

function value(formData, name) {
  return String(formData.get(name) || "").trim();
}

export async function createService(_previousState, formData) {
  const name = value(formData, "name");
  const description = value(formData, "description");
  const duration = Number(value(formData, "duration"));
  const normalizedPrice = value(formData, "price").replace(",", ".");
  const priceCents = Math.round(Number(normalizedPrice) * 100);

  if (name.length < 2 || !Number.isInteger(duration) || duration < 5 || !Number.isInteger(priceCents) || priceCents < 0) {
    return { error: "Informe nome, duração e valor válidos." };
  }

  const { supabase } = await getActionContext();
  const { error } = await supabase.rpc("upsert_own_service_offering", {
    service_name: name,
    service_description: description,
    service_price_cents: priceCents,
    service_duration_minutes: duration,
  });

  if (error) {
    return {
      error: error.message.toLowerCase().includes("professional profile")
        ? "Conecte seu acesso a um perfil profissional antes de definir serviços."
        : "Não foi possível salvar esse serviço.",
    };
  }

  revalidatePath("/app");
  revalidatePath("/app/servicos");
  return { success: "Serviço e regras atualizados. Sua agenda já pode usar essa configuração." };
}

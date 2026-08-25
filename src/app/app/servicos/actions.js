"use server";

import { revalidatePath } from "next/cache";
import { getActionContext } from "../../../lib/action-context";

function value(formData, name) {
  return String(formData.get(name) || "").trim();
}

export async function createService(_previousState, formData) {
  const intent = value(formData, "intent") || "save";
  const serviceId = value(formData, "serviceId");
  if (["activate", "deactivate"].includes(intent)) {
    if (!serviceId) return { error: "Serviço inválido.", success: "" };
    const { supabase } = await getActionContext();
    const { error } = await supabase.rpc("set_own_service_offering_active", {
      target_service_id: serviceId,
      offering_active: intent === "activate",
    });
    if (error) return { error: "Não foi possível alterar esse serviço.", success: "" };
    revalidatePath("/app");
    revalidatePath("/app/servicos");
    revalidatePath("/agendar", "layout");
    return {
      error: "",
      success: intent === "activate"
        ? "Serviço voltou para sua agenda."
        : "Serviço pausado. O histórico foi preservado.",
    };
  }

  const name = value(formData, "name");
  const description = value(formData, "description");
  const duration = Number(value(formData, "duration"));
  const bufferBefore = Number(value(formData, "bufferBefore") || "0");
  const bufferAfter = Number(value(formData, "bufferAfter") || "0");
  const normalizedPrice = value(formData, "price").replace(",", ".");
  const priceCents = Math.round(Number(normalizedPrice) * 100);

  if (name.length < 2 || !Number.isInteger(duration) || duration < 5 || !Number.isInteger(priceCents) || priceCents < 0
    || !Number.isInteger(bufferBefore) || !Number.isInteger(bufferAfter)
    || bufferBefore < 0 || bufferBefore > 180 || bufferAfter < 0 || bufferAfter > 180) {
    return { error: "Informe nome, duração e valor válidos." };
  }

  const { supabase } = await getActionContext();
  const { error } = await supabase.rpc("upsert_own_service_offering", {
    service_name: name,
    service_description: description,
    service_price_cents: priceCents,
    service_duration_minutes: duration,
    service_buffer_before_minutes: bufferBefore,
    service_buffer_after_minutes: bufferAfter,
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

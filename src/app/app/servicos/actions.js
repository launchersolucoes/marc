"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

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

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/entrar");

  const { data: membership } = await supabase
    .from("establishment_memberships")
    .select("establishment_id")
    .eq("user_id", authData.user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!membership) redirect("/onboarding");

  const { data: service, error: serviceError } = await supabase
    .from("services")
    .insert({
      establishment_id: membership.establishment_id,
      name,
      description: description || null,
    })
    .select("id")
    .single();

  if (serviceError) {
    return {
      error: serviceError.code === "23505"
        ? "Já existe um serviço com esse nome."
        : "Não foi possível cadastrar o serviço.",
    };
  }

  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("establishment_id", membership.establishment_id)
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (professional) {
    const { error: linkError } = await supabase.from("professional_services").insert({
      professional_id: professional.id,
      service_id: service.id,
      price_cents: priceCents,
      duration_minutes: duration,
    });

    if (linkError) {
      await supabase.from("services").delete().eq("id", service.id);
      return { error: "O serviço não pôde ser vinculado ao seu perfil." };
    }
  }

  revalidatePath("/app");
  revalidatePath("/app/servicos");
  return { success: "Serviço cadastrado. Sua agenda já pode usar essa configuração." };
}

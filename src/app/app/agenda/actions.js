"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

function value(formData, name) {
  return String(formData.get(name) || "").trim();
}

async function authenticatedContext() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/entrar");
  const { data: membership } = await supabase
    .from("establishment_memberships")
    .select("establishment_id, role")
    .eq("user_id", authData.user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (!membership) redirect("/onboarding");
  return { supabase, membership };
}

export async function saveAvailability(_previousState, formData) {
  const professionalId = value(formData, "professionalId");
  let schedule;
  try {
    schedule = JSON.parse(value(formData, "schedule"));
  } catch {
    return { error: "Revise os horários informados.", success: "" };
  }

  if (!professionalId || !Array.isArray(schedule)) {
    return { error: "Escolha ao menos um dia de atendimento.", success: "" };
  }

  const { supabase } = await authenticatedContext();
  const { error } = await supabase.rpc("configure_weekly_availability", {
    target_professional_id: professionalId,
    schedule,
  });

  if (error) return { error: "Não foi possível salvar essa disponibilidade.", success: "" };
  revalidatePath("/app/agenda");
  revalidatePath("/app");
  return { error: "", success: "Disponibilidade semanal atualizada." };
}

export async function createTimeOff(_previousState, formData) {
  const professionalId = value(formData, "professionalId");
  const startsAt = value(formData, "startsAt");
  const endsAt = value(formData, "endsAt");
  const reason = value(formData, "reason");
  if (!professionalId || !startsAt || !endsAt || startsAt >= endsAt) {
    return { error: "Informe um período de bloqueio válido.", success: "" };
  }

  const { supabase } = await authenticatedContext();
  const { error } = await supabase.rpc("create_professional_time_off", {
    target_professional_id: professionalId,
    local_start: startsAt,
    local_end: endsAt,
    time_off_reason: reason,
  });
  if (error) return { error: "Não foi possível bloquear esse período.", success: "" };

  revalidatePath("/app/agenda");
  return { error: "", success: "Período bloqueado na sua agenda." };
}

export async function createAppointment(_previousState, formData) {
  const professionalServiceId = value(formData, "professionalServiceId");
  const customerName = value(formData, "customerName");
  const customerPhone = value(formData, "customerPhone");
  const startsAt = value(formData, "startsAt");
  if (!professionalServiceId || customerName.length < 2 || customerPhone.length < 8 || !startsAt) {
    return { error: "Preencha cliente, telefone, serviço e horário.", success: "" };
  }

  const { supabase, membership } = await authenticatedContext();
  const { error } = await supabase.rpc("create_staff_appointment", {
    target_establishment_id: membership.establishment_id,
    target_professional_service_id: professionalServiceId,
    customer_name: customerName,
    customer_phone: customerPhone,
    customer_email: value(formData, "customerEmail"),
    local_start: startsAt,
    appointment_notes: value(formData, "notes"),
  });

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("availability")) return { error: "Esse horário está fora da disponibilidade do profissional.", success: "" };
    if (message.includes("blocked")) return { error: "Esse período está bloqueado na agenda.", success: "" };
    if (message.includes("conflict")) return { error: "Já existe um atendimento nesse horário.", success: "" };
    return { error: "Não foi possível criar o atendimento.", success: "" };
  }

  revalidatePath("/app/agenda");
  revalidatePath("/app");
  return { error: "", success: "Atendimento confirmado na agenda." };
}

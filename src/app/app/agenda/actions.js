"use server";

import { revalidatePath } from "next/cache";
import { getActionContext } from "../../../lib/action-context";

function value(formData, name) {
  return String(formData.get(name) || "").trim();
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

  const { supabase } = await getActionContext();
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

  const { supabase } = await getActionContext();
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

  const { supabase, membership } = await getActionContext();
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

export async function transitionAppointment(_previousState, formData) {
  const appointmentId = value(formData, "appointmentId");
  const status = value(formData, "status");
  const allowed = ["confirmed", "in_progress", "completed", "cancelled", "no_show"];
  if (!appointmentId || !allowed.includes(status)) {
    return { error: "Essa mudança de status não é válida.", success: "" };
  }

  const { supabase } = await getActionContext();
  const { error } = await supabase.rpc("transition_appointment_status", {
    target_appointment_id: appointmentId,
    target_status: status,
    target_payment_method: status === "completed" ? value(formData, "paymentMethod") : null,
    status_reason: value(formData, "reason"),
  });

  if (error) return { error: "Não foi possível atualizar o atendimento. Recarregue e tente novamente.", success: "" };

  revalidatePath("/app/agenda");
  revalidatePath("/app/financeiro");
  revalidatePath("/app");
  return {
    error: "",
    success: status === "completed" ? "Atendimento concluído e lançado no caixa." : "Status atualizado.",
  };
}

export async function rescheduleAppointment(_previousState, formData) {
  const appointmentId = value(formData, "appointmentId");
  const startsAt = value(formData, "startsAt");
  if (!appointmentId || !startsAt) return { error: "Informe a nova data e hora.", success: "" };

  const { supabase } = await getActionContext();
  const { error } = await supabase.rpc("reschedule_appointment", {
    target_appointment_id: appointmentId,
    local_start: startsAt,
  });

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("availability")) return { error: "O novo horário está fora da disponibilidade do profissional.", success: "" };
    if (message.includes("blocked")) return { error: "O profissional bloqueou esse período.", success: "" };
    if (message.includes("conflict")) return { error: "Já existe um atendimento nesse horário.", success: "" };
    if (message.includes("cannot")) return { error: "Este atendimento não pode mais ser reagendado.", success: "" };
    return { error: "Não foi possível reagendar. Revise o horário e tente novamente.", success: "" };
  }

  revalidatePath("/app/agenda");
  revalidatePath("/app");
  return { error: "", success: "Atendimento reagendado com sucesso." };
}

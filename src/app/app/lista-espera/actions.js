"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

function value(formData, name) {
  return String(formData.get(name) || "").trim();
}

async function client() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/entrar");
  return supabase;
}

export async function scheduleWaitlist(_previousState, formData) {
  const waitlistId = value(formData, "waitlistId");
  const startsAt = value(formData, "startsAt");
  if (!waitlistId || !startsAt) return { error: "Informe uma nova data e hora.", success: "" };

  const supabase = await client();
  const { data: appointmentId, error } = await supabase.rpc("schedule_waitlist_entry", {
    target_waitlist_id: waitlistId,
    local_start: startsAt,
  });

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("availability")) return { error: "O horário está fora da disponibilidade do profissional.", success: "" };
    if (message.includes("blocked")) return { error: "O profissional bloqueou esse período.", success: "" };
    if (message.includes("conflict")) return { error: "Esse horário já foi ocupado. Escolha outro.", success: "" };
    return { error: "Não foi possível converter esta solicitação em agendamento.", success: "" };
  }

  revalidatePath("/app/lista-espera");
  revalidatePath("/app/agenda");
  revalidatePath("/app");
  return { error: "", success: "Horário confirmado e removido da lista de espera.", appointmentId };
}

export async function cancelWaitlist(_previousState, formData) {
  const waitlistId = value(formData, "waitlistId");
  if (!waitlistId) return { error: "Solicitação não encontrada.", success: "" };

  const supabase = await client();
  const { error } = await supabase.rpc("cancel_waitlist_entry", {
    target_waitlist_id: waitlistId,
  });
  if (error) return { error: "Não foi possível encerrar essa solicitação.", success: "" };

  revalidatePath("/app/lista-espera");
  return { error: "", success: "Solicitação removida da lista de espera." };
}


"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPlatformAdminContext } from "../../lib/platform-admin-context";
import { normalizeSubscriptionCommand } from "../../lib/platform-admin";
import {
  normalizePilotCheckCommand,
  normalizePilotIssueCommand,
  normalizePilotIssueUpdate,
  normalizePilotProgramCommand,
} from "../../lib/platform-admin";

function field(formData, name) {
  return String(formData.get(name) || "").trim();
}

export async function updateEstablishmentSubscription(formData) {
  const { supabase } = await getPlatformAdminContext();
  const command = normalizeSubscriptionCommand({
    establishmentId: field(formData, "establishmentId"),
    planCode: field(formData, "planCode"),
    status: field(formData, "status"),
    accessDays: field(formData, "accessDays"),
  });

  if (!command) redirect("/master?erro=Revise+os+dados+da+assinatura");

  const { error } = await supabase.rpc("admin_update_establishment_subscription", {
    target_establishment_id: command.establishmentId,
    desired_plan: command.planCode,
    desired_status: command.status,
    access_days: command.accessDays,
  });

  if (error) redirect("/master?erro=Nao+foi+possivel+atualizar+a+assinatura");
  revalidatePath("/master");
  redirect("/master?atualizado=1");
}

function pilotRedirect(establishmentId, parameter) {
  redirect(`/master?piloto=${establishmentId}&${parameter}`);
}

export async function updatePilotProgram(formData) {
  const command = normalizePilotProgramCommand({
    establishmentId: field(formData, "establishmentId"),
    status: field(formData, "status"),
    round: field(formData, "round"),
    notes: field(formData, "notes"),
  });
  if (!command) redirect("/master?erro=Revise+os+dados+do+piloto");

  const { supabase } = await getPlatformAdminContext();
  const { error } = await supabase.rpc("admin_update_pilot_program", {
    target_establishment_id: command.establishmentId,
    desired_status: command.status,
    desired_round: command.round,
    desired_notes: command.notes,
  });
  if (error) pilotRedirect(command.establishmentId, "erro=Nao+foi+possivel+atualizar+o+piloto");
  revalidatePath("/master");
  pilotRedirect(command.establishmentId, "pilotoAtualizado=1");
}

export async function updatePilotCheckItem(formData) {
  const command = normalizePilotCheckCommand({
    establishmentId: field(formData, "establishmentId"),
    key: field(formData, "key"),
    status: field(formData, "status"),
    note: field(formData, "note"),
  });
  if (!command) redirect("/master?erro=Revise+o+item+do+checklist");

  const { supabase } = await getPlatformAdminContext();
  const { error } = await supabase.rpc("admin_update_pilot_check_item", {
    target_establishment_id: command.establishmentId,
    item_key: command.key,
    item_status: command.status,
    item_note: command.note,
  });
  if (error) pilotRedirect(command.establishmentId, "erro=Nao+foi+possivel+salvar+o+checklist");
  revalidatePath("/master");
  pilotRedirect(command.establishmentId, "checklistAtualizado=1");
}

export async function createPilotIssue(formData) {
  const command = normalizePilotIssueCommand({
    establishmentId: field(formData, "establishmentId"),
    title: field(formData, "title"),
    area: field(formData, "area"),
    priority: field(formData, "priority"),
    reproductionSteps: field(formData, "reproductionSteps"),
  });
  if (!command) redirect("/master?erro=Revise+os+dados+do+problema");

  const { supabase } = await getPlatformAdminContext();
  const { error } = await supabase.rpc("admin_create_pilot_issue", {
    target_establishment_id: command.establishmentId,
    issue_title: command.title,
    issue_area: command.area,
    issue_priority: command.priority,
    issue_reproduction_steps: command.reproductionSteps,
  });
  if (error) pilotRedirect(command.establishmentId, "erro=Nao+foi+possivel+registrar+o+problema");
  revalidatePath("/master");
  pilotRedirect(command.establishmentId, "problemaCriado=1");
}

export async function updatePilotIssue(formData) {
  const command = normalizePilotIssueUpdate({
    issueId: field(formData, "issueId"),
    status: field(formData, "status"),
    resolutionNotes: field(formData, "resolutionNotes"),
  });
  const establishmentId = field(formData, "establishmentId");
  if (!command || !/^[0-9a-f-]{36}$/i.test(establishmentId)) redirect("/master?erro=Revise+o+problema");

  const { supabase } = await getPlatformAdminContext();
  const { error } = await supabase.rpc("admin_update_pilot_issue", {
    target_issue_id: command.issueId,
    desired_status: command.status,
    desired_resolution_notes: command.resolutionNotes,
  });
  if (error) pilotRedirect(establishmentId, "erro=Nao+foi+possivel+atualizar+o+problema");
  revalidatePath("/master");
  pilotRedirect(establishmentId, "problemaAtualizado=1");
}

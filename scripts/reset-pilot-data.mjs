import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

if (process.env.PILOT_RESET_CONFIRM !== "reset-known-e2e-data") {
  throw new Error("Limpeza recusada: use apenas a confirmação explícita dos dados E2E conhecidos.");
}

const envSource = await readFile(resolve(".env.local"), "utf8");
const env = Object.fromEntries(
  envSource
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*([^#=]+)=(.*)$/))
    .filter(Boolean)
    .map((match) => [match[1].trim(), match[2].trim().replace(/^['"]|['"]$/g, "")]),
);

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || !env.E2E_EMAIL || !env.E2E_PASSWORD) {
  throw new Error("Supabase e a conta proprietária do piloto precisam estar configurados.");
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
const { error: authError } = await supabase.auth.signInWithPassword({ email: env.E2E_EMAIL, password: env.E2E_PASSWORD });
if (authError) throw authError;

const { data: authData } = await supabase.auth.getUser();
const { data: membership, error: membershipError } = await supabase
  .from("establishment_memberships")
  .select("establishment_id, role")
  .eq("user_id", authData.user.id)
  .eq("status", "active")
  .single();
if (membershipError || membership.role !== "owner") throw membershipError || new Error("A conta piloto não é proprietária.");

const testPhones = [
  "11999990001", "11999990002", "11999990021", "11999990022", "11999990023",
  "11999990024", "11999990025", "11999990031", "11999990032", "11999990033",
  "11999990034", "11999990035", "11999990036",
];

const { data: customers, error: customerError } = await supabase
  .from("customers")
  .select("id")
  .eq("establishment_id", membership.establishment_id)
  .in("phone", testPhones);
if (customerError) throw customerError;

const customerIds = (customers || []).map((customer) => customer.id);
if (customerIds.length) {
  const { error: appointmentError } = await supabase.from("appointments").delete().in("customer_id", customerIds);
  if (appointmentError) throw appointmentError;
  const { error: waitlistError } = await supabase.from("waitlist_entries").delete().in("customer_id", customerIds);
  if (waitlistError && !waitlistError.message.toLowerCase().includes("column")) throw waitlistError;
  const { error: deleteError } = await supabase.from("customers").delete().in("id", customerIds);
  if (deleteError) throw deleteError;
}

const professionalEmails = [env.E2E_PROFESSIONAL_EMAIL].filter(Boolean);
if (professionalEmails.length) {
  const { data: professionals, error: professionalError } = await supabase
    .from("professionals")
    .select("id")
    .eq("establishment_id", membership.establishment_id)
    .in("contact_email", professionalEmails);
  if (professionalError) throw professionalError;
  const professionalIds = (professionals || []).map((professional) => professional.id);
  if (professionalIds.length) {
    const { error: timeOffError } = await supabase
      .from("professional_time_off")
      .delete()
      .in("professional_id", professionalIds)
      .eq("reason", "Bloqueio operacional E2E");
    if (timeOffError) throw timeOffError;
  }
}

console.log(JSON.stringify({
  status: "clean",
  removedTestCustomers: customerIds.length,
  preserved: ["audit_events", "financial_entries", "pilot_issues", "configuration", "role_matrix"],
}));

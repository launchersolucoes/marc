import { createClient } from "@supabase/supabase-js";

export const pilotEmail = process.env.E2E_EMAIL;
export const pilotPassword = process.env.E2E_PASSWORD;
export const pilotSlug = process.env.E2E_ESTABLISHMENT_SLUG;

export function nextOpenDate(daysAhead = 1) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  while (date.getDay() === 0) date.setDate(date.getDate() + 1);
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function nextSundayDate() {
  const date = new Date();
  const daysUntilSunday = (7 - date.getDay()) % 7 || 7;
  date.setDate(date.getDate() + daysUntilSunday);
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

const authenticatedClients = new Map();

function authenticatedClient(email, password) {
  if (authenticatedClients.has(email)) return authenticatedClients.get(email);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const clientPromise = supabase.auth.signInWithPassword({ email, password }).then(({ error }) => {
    if (error) throw error;
    return supabase;
  }).catch((error) => {
    authenticatedClients.delete(email);
    throw error;
  });
  authenticatedClients.set(email, clientPromise);
  return clientPromise;
}

export async function getPilotOwnerContext() {
  if (!pilotEmail || !pilotPassword) throw new Error("Credenciais do piloto ausentes.");
  const supabase = await authenticatedClient(pilotEmail, pilotPassword);
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;

  const { data: membership, error: membershipError } = await supabase
    .from("establishment_memberships")
    .select("establishment_id")
    .eq("user_id", authData.user.id)
    .eq("status", "active")
    .single();
  if (membershipError) throw membershipError;

  return { supabase, establishmentId: membership.establishment_id };
}

export async function cleanupPilotCustomer(customerPhone) {
  return cleanupPilotCustomers([customerPhone]);
}

export async function cleanupPilotCustomers(customerPhones) {
  if (!pilotEmail || !pilotPassword) return;
  const { supabase, establishmentId } = await getPilotOwnerContext();

  const { data: customers, error: customerReadError } = await supabase
    .from("customers")
    .select("id")
    .eq("establishment_id", establishmentId)
    .in("phone", customerPhones);
  if (customerReadError) throw customerReadError;

  const customerIds = (customers || []).map((customer) => customer.id);
  if (!customerIds.length) return;

  const { error: appointmentError } = await supabase
    .from("appointments")
    .delete()
    .in("customer_id", customerIds);
  if (appointmentError) throw appointmentError;

  const { error: customerDeleteError } = await supabase
    .from("customers")
    .delete()
    .in("id", customerIds);
  if (customerDeleteError) throw customerDeleteError;
}

export async function cleanupProfessionalTimeOff(reason) {
  const email = process.env.E2E_PROFESSIONAL_EMAIL;
  const password = process.env.E2E_PROFESSIONAL_PASSWORD;
  if (!email || !password) return;

  const supabase = await authenticatedClient(email, password);
  const { data: authData } = await supabase.auth.getUser();
  const { data: professional, error: professionalError } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", authData.user.id)
    .single();
  if (professionalError) throw professionalError;

  const { error: deleteError } = await supabase
    .from("professional_time_off")
    .delete()
    .eq("professional_id", professional.id)
    .eq("reason", reason);
  if (deleteError) throw deleteError;
}

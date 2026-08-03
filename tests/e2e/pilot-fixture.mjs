import { createClient } from "@supabase/supabase-js";

export const pilotEmail = process.env.E2E_EMAIL;
export const pilotPassword = process.env.E2E_PASSWORD;
export const pilotSlug = process.env.E2E_ESTABLISHMENT_SLUG;

export function nextOpenDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  while (date.getDay() === 0) date.setDate(date.getDate() + 1);
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export async function cleanupPilotCustomer(customerPhone) {
  if (!pilotEmail || !pilotPassword) return;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: pilotEmail,
    password: pilotPassword,
  });
  if (authError) throw authError;

  const { data: authData } = await supabase.auth.getUser();
  const { data: membership, error: membershipError } = await supabase
    .from("establishment_memberships")
    .select("establishment_id")
    .eq("user_id", authData.user.id)
    .eq("status", "active")
    .single();
  if (membershipError) throw membershipError;

  const { data: customers, error: customerReadError } = await supabase
    .from("customers")
    .select("id")
    .eq("establishment_id", membership.establishment_id)
    .eq("phone", customerPhone);
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

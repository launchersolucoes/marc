import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

export async function getAppContext() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/entrar");

  const { data: membership } = await supabase
    .from("establishment_memberships")
    .select("role, establishment_id, establishment:establishments(id, name, slug, timezone)")
    .eq("user_id", authData.user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!membership?.establishment) redirect("/onboarding");

  const { data: professional } = await supabase
    .from("professionals")
    .select("id, display_name")
    .eq("establishment_id", membership.establishment_id)
    .eq("user_id", authData.user.id)
    .maybeSingle();

  return {
    supabase,
    user: authData.user,
    membership,
    establishment: membership.establishment,
    professional,
  };
}

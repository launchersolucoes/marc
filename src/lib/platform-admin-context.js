import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

export async function getPlatformAdminContext() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/entrar?next=/master");

  const { data: isPlatformAdmin } = await supabase.rpc("is_platform_admin");
  if (!isPlatformAdmin) redirect("/app");

  return { supabase, user: authData.user };
}

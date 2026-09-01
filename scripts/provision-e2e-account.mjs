import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { currentLegalDocuments } from "../src/lib/legal-documents.js";

const confirmation = process.env.E2E_PROVISION_CONFIRM;
if (confirmation !== "provision-dedicated-pilot") {
  throw new Error("Provisionamento recusado: confirme explicitamente a criação da conta piloto.");
}

const envPath = resolve(".env.local");
const envSource = await readFile(envPath, "utf8");

function parseEnv(source) {
  return Object.fromEntries(
    source
      .split(/\r?\n/)
      .map((line) => line.match(/^\s*([^#=]+)=(.*)$/))
      .filter(Boolean)
      .map((match) => [match[1].trim(), match[2].trim().replace(/^['"]|['"]$/g, "")]),
  );
}

function setEnvValues(source, values) {
  let next = source.trimEnd();
  for (const [name, value] of Object.entries(values)) {
    const line = `${name}=${value}`;
    const pattern = new RegExp(`^${name}=.*$`, "m");
    next = pattern.test(next) ? next.replace(pattern, line) : `${next}\n${line}`;
  }
  return `${next}\n`;
}

const env = parseEnv(envSource);
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!supabaseUrl || !publishableKey) throw new Error("Supabase não está configurado em .env.local.");

const datePart = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
const email = env.E2E_EMAIL || `launchersolucoes+marc-piloto-${datePart}@gmail.com`;
const password = env.E2E_PASSWORD || `Marc!${randomUUID().replaceAll("-", "")}`;
const supabase = createClient(supabaseUrl, publishableKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

let authResult;
if (env.E2E_EMAIL && env.E2E_PASSWORD) {
  authResult = await supabase.auth.signInWithPassword({ email, password });
} else {
  authResult = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: "Operação Piloto Marc" } },
  });
}

if (authResult.error) throw authResult.error;

await writeFile(envPath, setEnvValues(envSource, { E2E_EMAIL: email, E2E_PASSWORD: password }), "utf8");

if (!authResult.data.session || !authResult.data.user) {
  console.log(JSON.stringify({ status: "confirmation_required" }));
  process.exit(2);
}

const user = authResult.data.user;
let { data: memberships, error: membershipError } = await supabase
  .from("establishment_memberships")
  .select("establishment_id, role, establishment:establishments(id, slug, name)")
  .eq("user_id", user.id)
  .eq("status", "active")
  .limit(1);
if (membershipError) throw membershipError;

let establishmentId = memberships?.[0]?.establishment_id;
let establishmentSlug = memberships?.[0]?.establishment?.slug;

if (!establishmentId) {
  establishmentSlug = `marc-piloto-${user.id.slice(0, 8)}`;
  const { data, error } = await supabase.rpc("onboard_establishment", {
    establishment_name: "Estúdio Piloto Marc",
    establishment_slug: establishmentSlug,
    establishment_phone: "00000000000",
    establishment_email: email,
    establishment_category: "beauty_studio",
    terms_version: currentLegalDocuments.terms.version,
    terms_content_sha256: currentLegalDocuments.terms.contentSha256,
    privacy_version: currentLegalDocuments.privacy.version,
    privacy_content_sha256: currentLegalDocuments.privacy.contentSha256,
    acceptance_confirmed: true,
    establishment_address: "",
    establishment_city: "",
    establishment_state: "",
    owner_works_here: true,
  });
  if (error) throw error;
  establishmentId = data;
}

const offerings = [
  {
    service_name: "Atendimento piloto",
    service_description: "Serviço ilustrativo para validar o fluxo completo do Marc.",
    service_price_cents: 5000,
    service_duration_minutes: 45,
  },
  {
    service_name: "Atendimento rápido piloto",
    service_description: "Serviço ilustrativo de menor duração.",
    service_price_cents: 3000,
    service_duration_minutes: 30,
  },
];

for (const offering of offerings) {
  const { error } = await supabase.rpc("upsert_own_service_offering", offering);
  if (error) throw error;
}

const { data: professional, error: professionalError } = await supabase
  .from("professionals")
  .select("id")
  .eq("establishment_id", establishmentId)
  .eq("user_id", user.id)
  .single();
if (professionalError) throw professionalError;

const schedule = [1, 2, 3, 4, 5, 6].map((weekday) => ({
  weekday,
  starts_at: "09:00",
  ends_at: "18:00",
}));
const { error: availabilityError } = await supabase.rpc("configure_weekly_availability", {
  target_professional_id: professional.id,
  schedule,
});
if (availabilityError) throw availabilityError;

const provisionedEnvSource = await readFile(envPath, "utf8");
await writeFile(
  envPath,
  setEnvValues(provisionedEnvSource, { E2E_ESTABLISHMENT_SLUG: establishmentSlug }),
  "utf8",
);

console.log(JSON.stringify({
  status: "ready",
  establishment: "Estúdio Piloto Marc",
  slug: establishmentSlug,
  services: offerings.length,
  scheduleDays: schedule.length,
}));

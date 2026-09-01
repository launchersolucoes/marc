import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { currentLegalDocuments } from "../src/lib/legal-documents.js";

const confirmation = process.env.E2E_ROLE_PROVISION_CONFIRM;
if (!["prepare-role-credentials", "provision-role-matrix"].includes(confirmation)) {
  throw new Error("Provisionamento recusado: confirme explicitamente a matriz de papéis.");
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

function client(url, key) {
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

const env = parseEnv(envSource);
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!supabaseUrl || !publishableKey || !env.E2E_EMAIL || !env.E2E_PASSWORD) {
  throw new Error("A conta proprietária do piloto e o Supabase precisam estar configurados em .env.local.");
}

const owner = client(supabaseUrl, publishableKey);
const { error: ownerAuthError } = await owner.auth.signInWithPassword({
  email: env.E2E_EMAIL,
  password: env.E2E_PASSWORD,
});
if (ownerAuthError) throw ownerAuthError;

const { data: ownerAuth } = await owner.auth.getUser();
const { data: ownerMembership, error: ownerMembershipError } = await owner
  .from("establishment_memberships")
  .select("establishment_id, role")
  .eq("user_id", ownerAuth.user.id)
  .eq("status", "active")
  .single();
if (ownerMembershipError || ownerMembership.role !== "owner") {
  throw ownerMembershipError || new Error("A conta piloto precisa ser dona do estabelecimento.");
}

const unique = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
const definitions = [
  { role: "manager", envPrefix: "E2E_MANAGER", name: "Gerência Piloto" },
  { role: "receptionist", envPrefix: "E2E_RECEPTIONIST", name: "Recepção Piloto" },
  { role: "professional", envPrefix: "E2E_PROFESSIONAL", name: "Profissional Piloto" },
];
let persistedEnvSource = envSource;

for (const definition of definitions) {
  const emailKey = `${definition.envPrefix}_EMAIL`;
  const passwordKey = `${definition.envPrefix}_PASSWORD`;
  env[emailKey] ||= `launchersolucoes+marc-${definition.role}-${unique}@gmail.com`;
  env[passwordKey] ||= `Marc!${definition.role}${randomUUID().replaceAll("-", "")}`;
  persistedEnvSource = setEnvValues(persistedEnvSource, {
    [emailKey]: env[emailKey],
    [passwordKey]: env[passwordKey],
  });
}
await writeFile(envPath, persistedEnvSource, "utf8");

if (confirmation === "prepare-role-credentials") {
  console.log(JSON.stringify({ status: "credentials_ready", roles: definitions.map(({ role }) => role) }));
  process.exit(0);
}

for (const definition of definitions) {
  const emailKey = `${definition.envPrefix}_EMAIL`;
  const passwordKey = `${definition.envPrefix}_PASSWORD`;
  const email = env[emailKey];
  const password = env[passwordKey];
  const roleClient = client(supabaseUrl, publishableKey);

  const authResult = await roleClient.auth.signInWithPassword({ email, password });
  if (authResult.error) {
    if (authResult.error.message.toLowerCase().includes("email not confirmed")) {
      throw new Error(`Confirme a conta ${definition.role} no Supabase e execute o provisionamento novamente.`);
    }
    throw authResult.error;
  }
  if (!authResult.data.session || !authResult.data.user) {
    throw new Error(`A conta ${definition.role} exige confirmação de e-mail antes de continuar.`);
  }

  const userId = authResult.data.user.id;
  const { data: currentMembership, error: membershipReadError } = await roleClient
    .from("establishment_memberships")
    .select("establishment_id, role, status")
    .eq("user_id", userId)
    .eq("establishment_id", ownerMembership.establishment_id)
    .maybeSingle();
  if (membershipReadError) throw membershipReadError;

  if (currentMembership?.role !== definition.role || currentMembership?.status !== "active") {
    let professionalId = null;
    if (definition.role === "professional") {
      const { data: existingProfessional, error: professionalReadError } = await owner
        .from("professionals")
        .select("id")
        .eq("establishment_id", ownerMembership.establishment_id)
        .eq("contact_email", email)
        .maybeSingle();
      if (professionalReadError) throw professionalReadError;
      professionalId = existingProfessional?.id;

      if (!professionalId) {
        const { data, error } = await owner.rpc("create_professional_profile", {
          target_establishment_id: ownerMembership.establishment_id,
          professional_name: definition.name,
          professional_email: email,
          professional_phone: "",
          professional_color: "#7c8cff",
        });
        if (error) throw error;
        professionalId = data;
      }
    }

    const { data: token, error: invitationError } = await owner.rpc("create_team_invitation", {
      target_establishment_id: ownerMembership.establishment_id,
      invite_email: email,
      invite_role: definition.role,
      target_professional_id: professionalId,
    });
    if (invitationError || !token) throw invitationError || new Error("Convite não criado.");

    const { error: acceptanceError } = await roleClient.rpc("accept_team_invitation", {
      invitation_token: token,
      terms_version: currentLegalDocuments.terms.version,
      terms_content_sha256: currentLegalDocuments.terms.contentSha256,
      privacy_version: currentLegalDocuments.privacy.version,
      privacy_content_sha256: currentLegalDocuments.privacy.contentSha256,
      acceptance_confirmed: true,
    });
    if (acceptanceError) throw acceptanceError;
  }

  if (definition.role === "professional") {
    const { error: serviceError } = await roleClient.rpc("upsert_own_service_offering", {
      service_name: "Atendimento do profissional piloto",
      service_description: "Serviço isolado para validar permissões de agenda.",
      service_price_cents: 4200,
      service_duration_minutes: 45,
    });
    if (serviceError) throw serviceError;

    const { data: professional, error: professionalError } = await roleClient
      .from("professionals")
      .select("id")
      .eq("user_id", userId)
      .eq("establishment_id", ownerMembership.establishment_id)
      .single();
    if (professionalError) throw professionalError;

    const { error: availabilityError } = await roleClient.rpc("configure_weekly_availability", {
      target_professional_id: professional.id,
      schedule: [1, 2, 3, 4, 5, 6].map((weekday) => ({
        weekday,
        starts_at: "09:00",
        ends_at: "18:00",
      })),
    });
    if (availabilityError) throw availabilityError;
  }

  const { data: verifiedMembership, error: verificationError } = await roleClient
    .from("establishment_memberships")
    .select("role, status")
    .eq("user_id", userId)
    .eq("establishment_id", ownerMembership.establishment_id)
    .single();
  if (verificationError || verifiedMembership.role !== definition.role || verifiedMembership.status !== "active") {
    throw verificationError || new Error(`Papel ${definition.role} não foi verificado.`);
  }

}

console.log(JSON.stringify({
  status: "ready",
  establishmentId: ownerMembership.establishment_id,
  roles: definitions.map(({ role }) => role),
}));

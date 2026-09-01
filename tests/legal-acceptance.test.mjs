import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { currentLegalDocuments, hasCurrentLegalAcceptance } from "../src/lib/legal-documents.js";

const migrationUrl = new URL("../supabase/migrations/20260901100000_versioned_legal_acceptance.sql", import.meta.url);

test("current legal document versions match the published pages", () => {
  assert.equal(currentLegalDocuments.terms.version, "2026-08-29");
  assert.equal(currentLegalDocuments.privacy.version, "2026-08-30");
  assert.equal(currentLegalDocuments.terms.href, "/termos");
  assert.equal(currentLegalDocuments.privacy.href, "/privacidade");
});

test("published legal page sources match their immutable evidence hashes", async () => {
  const [termsSource, privacySource] = await Promise.all([
    readFile(new URL("../src/app/termos/page.jsx", import.meta.url)),
    readFile(new URL("../src/app/privacidade/page.jsx", import.meta.url)),
  ]);

  assert.equal(createHash("sha256").update(termsSource).digest("hex"), currentLegalDocuments.terms.contentSha256);
  assert.equal(createHash("sha256").update(privacySource).digest("hex"), currentLegalDocuments.privacy.contentSha256);
});

test("acceptance helper requires both current versions", () => {
  assert.equal(hasCurrentLegalAcceptance([]), false);
  assert.equal(hasCurrentLegalAcceptance([
    { document_type: "terms", document_version: currentLegalDocuments.terms.version },
  ]), false);
  assert.equal(hasCurrentLegalAcceptance([
    { document_type: "terms", document_version: currentLegalDocuments.terms.version },
    { document_type: "privacy", document_version: currentLegalDocuments.privacy.version },
  ]), true);
});

test("database enforces explicit versioned acceptance before onboarding and invitations", async () => {
  const migration = await readFile(migrationUrl, "utf8");

  assert.match(migration, /create table public\.legal_document_acceptances/);
  assert.match(migration, /content_sha256 text not null/);
  assert.match(migration, /subject_reference text not null/);
  assert.match(migration, /user_id uuid references auth\.users \(id\) on delete set null/);
  assert.match(migration, /acceptance_confirmed boolean default false/);
  assert.match(migration, /if not acceptance_confirmed then[\s\S]*Legal acceptance must be explicit/);
  assert.match(migration, /if terms_version is distinct from current_terms_version/);
  assert.match(migration, /create function public\.onboard_establishment[\s\S]*'onboarding'/);
  assert.match(migration, /create function public\.accept_team_invitation[\s\S]*'invitation'/);
  assert.match(migration, /create function public\.record_settings_legal_acceptance[\s\S]*'settings'/);
  assert.doesNotMatch(migration, /grant insert on public\.legal_document_acceptances/);
});

test("onboarding and invitations require a visible checkbox and server-side confirmation", async () => {
  const [onboardingForm, onboardingAction, invitationPage, invitationAction] = await Promise.all([
    readFile(new URL("../src/components/onboarding-form.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/onboarding/actions.js", import.meta.url), "utf8"),
    readFile(new URL("../src/app/convite/[token]/page.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/convite/[token]/actions.js", import.meta.url), "utf8"),
  ]);

  assert.match(onboardingForm, /name="legalAcceptance" required/);
  assert.match(invitationPage, /name="legalAcceptance" required/);
  assert.match(onboardingAction, /formData\.get\("legalAcceptance"\) === "on"/);
  assert.match(invitationAction, /formData\.get\("legalAcceptance"\) !== "on"/);
  assert.match(onboardingAction, /terms_content_sha256/);
  assert.match(invitationAction, /privacy_content_sha256/);
});

test("pilot provisioners follow the versioned legal RPC signatures", async () => {
  const [accountProvisioner, roleProvisioner] = await Promise.all([
    readFile(new URL("../scripts/provision-e2e-account.mjs", import.meta.url), "utf8"),
    readFile(new URL("../scripts/provision-role-matrix.mjs", import.meta.url), "utf8"),
  ]);

  for (const provisioner of [accountProvisioner, roleProvisioner]) {
    assert.match(provisioner, /currentLegalDocuments\.terms\.contentSha256/);
    assert.match(provisioner, /currentLegalDocuments\.privacy\.contentSha256/);
    assert.match(provisioner, /acceptance_confirmed: true/);
  }
});

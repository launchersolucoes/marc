import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { retentionPolicyVersion, retentionRules } from "../src/lib/data-retention.js";

test("retention matrix is explicit, unique and never presented as approved", () => {
  assert.equal(retentionPolicyVersion, "0.1");
  assert.equal(new Set(retentionRules.map((rule) => rule.key)).size, retentionRules.length);
  assert.ok(retentionRules.length >= 6);
  assert.ok(retentionRules.every((rule) => rule.category && rule.period && rule.summary && rule.disposition));
  assert.ok(retentionRules.every((rule) => ["purpose_based", "pending_validation"].includes(rule.status)));
  assert.equal(retentionRules.some((rule) => rule.status === "approved"), false);
});

test("proposed fixed periods remain pending validation", () => {
  const financial = retentionRules.find((rule) => rule.key === "financial");
  const audit = retentionRules.find((rule) => rule.key === "audit");
  const privacy = retentionRules.find((rule) => rule.key === "privacy_requests");

  assert.match(financial.period, /5 anos/i);
  assert.match(audit.period, /12 meses/i);
  assert.match(privacy.period, /5 anos/i);
  assert.equal(financial.status, "pending_validation");
  assert.equal(audit.status, "pending_validation");
  assert.equal(privacy.status, "pending_validation");
});

test("operational protocol carries disclaimer, backup constraint and official sources", async () => {
  const document = await readFile(new URL("../docs/data-retention-policy.md", import.meta.url), "utf8");

  assert.match(document, /não é parecer jurídico/i);
  assert.match(document, /sem backup agendado/i);
  assert.match(document, /dados sintéticos/i);
  assert.match(document, /planalto\.gov\.br/);
  assert.match(document, /gov\.br\/anpd/);
});

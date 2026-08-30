import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizePilotCheckCommand,
  normalizePilotIssueCommand,
  normalizePilotIssueUpdate,
  normalizePilotProgramCommand,
  normalizePrivacyRequestCommand,
  normalizeSubscriptionCommand,
} from "../src/lib/platform-admin.js";

const establishmentId = "11111111-1111-4111-8111-111111111111";

test("normalizes a valid platform subscription command", () => {
  assert.deepEqual(
    normalizeSubscriptionCommand({ establishmentId, planCode: "pro", status: "active", accessDays: "30" }),
    { establishmentId, planCode: "pro", status: "active", accessDays: 30 },
  );
});

test("validates privacy request decisions and requires terminal evidence", () => {
  const requestId = "33333333-3333-4333-8333-333333333333";
  assert.deepEqual(normalizePrivacyRequestCommand({ requestId, status: "in_review", resolutionNotes: "" }), {
    requestId,
    status: "in_review",
    resolutionNotes: "",
  });
  assert.deepEqual(normalizePrivacyRequestCommand({ requestId, status: "completed", resolutionNotes: "  Identidade validada e dados anonimizados.  " }), {
    requestId,
    status: "completed",
    resolutionNotes: "Identidade validada e dados anonimizados.",
  });
  assert.equal(normalizePrivacyRequestCommand({ requestId, status: "completed", resolutionNotes: "" }), null);
  assert.equal(normalizePrivacyRequestCommand({ requestId, status: "deleted", resolutionNotes: "Motivo" }), null);
});

test("rejects unsupported plans, states and access periods", () => {
  assert.equal(normalizeSubscriptionCommand({ establishmentId, planCode: "enterprise", status: "active", accessDays: 30 }), null);
  assert.equal(normalizeSubscriptionCommand({ establishmentId, planCode: "pro", status: "paused", accessDays: 30 }), null);
  assert.equal(normalizeSubscriptionCommand({ establishmentId, planCode: "pro", status: "active", accessDays: 0 }), null);
  assert.equal(normalizeSubscriptionCommand({ establishmentId: "invalid", planCode: "pro", status: "active", accessDays: 30 }), null);
});

test("normalizes pilot coordination commands without accepting arbitrary states", () => {
  assert.deepEqual(normalizePilotProgramCommand({ establishmentId, status: "testing", round: "2", notes: "  Rodada mobile  " }), {
    establishmentId,
    status: "testing",
    round: 2,
    notes: "Rodada mobile",
  });
  assert.deepEqual(normalizePilotCheckCommand({ establishmentId, key: "mobile_pwa", status: "passed", note: " iPhone validado " }), {
    establishmentId,
    key: "mobile_pwa",
    status: "passed",
    note: "iPhone validado",
  });
  assert.equal(normalizePilotProgramCommand({ establishmentId, status: "released", round: 1 }), null);
  assert.equal(normalizePilotCheckCommand({ establishmentId, key: "../../unsafe", status: "passed" }), null);
});

test("validates issue intake and lifecycle commands", () => {
  const issueId = "22222222-2222-4222-8222-222222222222";
  assert.deepEqual(normalizePilotIssueCommand({ establishmentId, title: "Sheet não fecha", area: "agenda", priority: "p1", reproductionSteps: "Abrir no iPhone" }), {
    establishmentId,
    title: "Sheet não fecha",
    area: "agenda",
    priority: "p1",
    reproductionSteps: "Abrir no iPhone",
  });
  assert.deepEqual(normalizePilotIssueUpdate({ issueId, status: "resolved", resolutionNotes: "Corrigido" }), {
    issueId,
    status: "resolved",
    resolutionNotes: "Corrigido",
  });
  assert.equal(normalizePilotIssueCommand({ establishmentId, title: "x", area: "senha", priority: "p0" }), null);
  assert.equal(normalizePilotIssueUpdate({ issueId, status: "deleted" }), null);
});

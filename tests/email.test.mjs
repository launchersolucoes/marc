import test from "node:test";
import assert from "node:assert/strict";
import { buildInvitationEmail } from "../src/lib/email-template.js";

test("builds a useful invitation message", () => {
  const message = buildInvitationEmail({
    establishmentName: "Barbearia Central",
    role: "professional",
    inviteUrl: "https://usemarc.com.br/convite/abc",
  });

  assert.match(message.subject, /Barbearia Central/);
  assert.match(message.text, /profissional/);
  assert.match(message.html, /Aceitar convite/);
  assert.match(message.html, /https:\/\/usemarc.com.br\/convite\/abc/);
});

test("escapes establishment content in invitation html", () => {
  const message = buildInvitationEmail({
    establishmentName: '<script>alert("x")</script>',
    role: "manager",
    inviteUrl: "https://example.com/invite",
  });

  assert.doesNotMatch(message.html, /<script>/);
  assert.match(message.html, /&lt;script&gt;/);
});

test("transactional delivery times out safely and logs no recipient data", async () => {
  const source = await import("node:fs/promises").then(({ readFile }) => readFile("src/lib/email.js", "utf8"));

  assert.match(source, /AbortSignal\.timeout\(8000\)/);
  assert.match(source, /marc_email_delivery_failed/);
  assert.doesNotMatch(source, /logDeliveryFailure\([^)]*to/);
  assert.doesNotMatch(source, /console\.error\([^)]*(subject|html|text)/);
});

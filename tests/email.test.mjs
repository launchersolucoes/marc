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

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const roleLabels = {
  manager: "gerente",
  receptionist: "recepcionista",
  professional: "profissional",
};

export function buildInvitationEmail({ establishmentName, role, inviteUrl }) {
  const safeName = escapeHtml(establishmentName);
  const safeUrl = escapeHtml(inviteUrl);
  const roleLabel = roleLabels[role] || "membro da equipe";

  return {
    subject: `Convite para a equipe de ${establishmentName} no Marc`,
    text: `Você foi convidado para participar de ${establishmentName} como ${roleLabel}. Aceite o convite em até 7 dias: ${inviteUrl}`,
    html: `
      <div style="background:#f6f3ee;padding:32px 16px;font-family:Arial,sans-serif;color:#171717">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2ddd5;border-radius:16px;padding:32px">
          <div style="display:inline-block;margin-bottom:24px;padding:6px 10px;border-radius:6px;background:#ffa500;font-size:12px;font-weight:700">MARC</div>
          <h1 style="margin:0 0 12px;font-size:28px;line-height:1.1">Você foi convidado para ${safeName}</h1>
          <p style="margin:0 0 24px;color:#65615b;line-height:1.6">Entre no Marc como <strong>${roleLabel}</strong> para acessar a agenda e a operação do estabelecimento.</p>
          <a href="${safeUrl}" style="display:inline-block;padding:13px 18px;border-radius:9px;background:#ffa500;color:#171717;text-decoration:none;font-weight:700">Aceitar convite</a>
          <p style="margin:24px 0 0;color:#8b857d;font-size:12px;line-height:1.5">Este link expira em 7 dias. Se você não esperava este convite, ignore este e-mail.</p>
        </div>
      </div>`,
  };
}

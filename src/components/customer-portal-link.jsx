"use client";

import { Check, Copy, Link2, LoaderCircle, RotateCw, ShieldX } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { createCustomerPortalLink, revokeCustomerPortalLink } from "../app/app/clientes/actions";

const initialState = { error: "", path: "" };
const initialRevokeState = { error: "", success: "" };

export default function CustomerPortalLink({ customerId, initialAccess = null }) {
  const [state, action, pending] = useActionState(createCustomerPortalLink, initialState);
  const [revokeState, revokeAction, revokePending] = useActionState(revokeCustomerPortalLink, initialRevokeState);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [active, setActive] = useState(Boolean(initialAccess?.active));
  const [linkPath, setLinkPath] = useState("");
  const [confirmingRevoke, setConfirmingRevoke] = useState(false);

  useEffect(() => setOrigin(window.location.origin), []);
  useEffect(() => {
    if (!state.path) return;
    setLinkPath(state.path);
    setActive(true);
    setConfirmingRevoke(false);
  }, [state.path]);
  useEffect(() => {
    if (!revokeState.success) return;
    setActive(false);
    setLinkPath("");
    setConfirmingRevoke(false);
  }, [revokeState.success]);
  const fullLink = linkPath && origin ? `${origin}${linkPath}` : "";
  const expiration = active && initialAccess?.expires_at
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(initialAccess.expires_at))
    : "";

  async function copyLink() {
    if (!fullLink) return;
    await navigator.clipboard.writeText(fullLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  }

  return (
    <section className="customer-portal-link-card">
      <div><Link2 size={19} /><span><strong>Área do cliente</strong><small>{active ? `Acesso ativo${expiration ? ` até ${expiration}` : ""}. Um novo link substitui o atual.` : "Sem acesso ativo. Gere um link quando o cliente precisar administrar os horários."}</small></span></div>
      <div className="customer-portal-link-actions">
        <form action={action}>
          <input type="hidden" name="customerId" value={customerId} />
          <button className="button button--secondary" type="submit" disabled={pending || revokePending}>
            {pending ? <><LoaderCircle className="spin" size={16} /> Gerando</> : active ? <><RotateCw size={16} /> Substituir link</> : <><Link2 size={16} /> Gerar link do cliente</>}
          </button>
        </form>
        {active && !confirmingRevoke && <button className="button button--quiet" type="button" disabled={pending || revokePending} onClick={() => setConfirmingRevoke(true)}><ShieldX size={16} /> Revogar acesso</button>}
      </div>
      {confirmingRevoke && <div className="customer-portal-revoke-confirm" role="group" aria-label="Confirmar revogação do acesso do cliente">
        <p>O link deixará de funcionar imediatamente. Os horários e o cadastro não serão apagados.</p>
        <form action={revokeAction}>
          <input type="hidden" name="customerId" value={customerId} />
          <button className="button button--danger" type="submit" disabled={revokePending}>{revokePending ? <><LoaderCircle className="spin" size={16} /> Revogando</> : "Revogar agora"}</button>
          <button className="button button--quiet" type="button" disabled={revokePending} onClick={() => setConfirmingRevoke(false)}>Manter acesso</button>
        </form>
      </div>}
      {state.error && <p className="form-message form-message--error" role="alert">{state.error}</p>}
      {revokeState.error && <p className="form-message form-message--error" role="alert">{revokeState.error}</p>}
      {revokeState.success && !active && <p className="form-message form-message--success" role="status"><Check size={16} /> {revokeState.success}</p>}
      {fullLink && <div className="customer-portal-link-result"><input value={fullLink} readOnly aria-label="Link da área do cliente" /><button type="button" onClick={copyLink}>{copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copiado" : "Copiar"}</button></div>}
    </section>
  );
}

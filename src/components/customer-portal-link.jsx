"use client";

import { Check, Copy, Link2, LoaderCircle, RotateCw } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { createCustomerPortalLink } from "../app/app/clientes/actions";

const initialState = { error: "", path: "" };

export default function CustomerPortalLink({ customerId }) {
  const [state, action, pending] = useActionState(createCustomerPortalLink, initialState);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => setOrigin(window.location.origin), []);
  const fullLink = state.path && origin ? `${origin}${state.path}` : "";

  async function copyLink() {
    if (!fullLink) return;
    await navigator.clipboard.writeText(fullLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  }

  return (
    <section className="customer-portal-link-card">
      <div><Link2 size={19} /><span><strong>Área do cliente</strong><small>O link dá acesso aos horários e substitui qualquer link anterior.</small></span></div>
      <form action={action}>
        <input type="hidden" name="customerId" value={customerId} />
        <button className="button button--secondary" type="submit" disabled={pending}>
          {pending ? <><LoaderCircle className="spin" size={16} /> Gerando</> : state.path ? <><RotateCw size={16} /> Gerar outro link</> : <><Link2 size={16} /> Gerar link do cliente</>}
        </button>
      </form>
      {state.error && <p className="form-message form-message--error" role="alert">{state.error}</p>}
      {fullLink && <div className="customer-portal-link-result"><input value={fullLink} readOnly aria-label="Link da área do cliente" /><button type="button" onClick={copyLink}>{copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copiado" : "Copiar"}</button></div>}
    </section>
  );
}

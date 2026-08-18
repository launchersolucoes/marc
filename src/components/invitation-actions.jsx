"use client";

import { Check, Copy, LoaderCircle, RefreshCw, X } from "lucide-react";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { renewInvitation, revokeInvitation } from "../app/app/equipe/actions";

const initialState = { error: "", success: "", inviteUrl: "" };

function RenewButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending}>{pending ? <LoaderCircle className="spin" size={14} /> : <RefreshCw size={14} />}<span>Renovar</span></button>;
}

function RevokeButton({ confirming, onConfirm }) {
  const { pending } = useFormStatus();
  if (!confirming) return <button type="button" onClick={onConfirm}><X size={14} /><span>Revogar</span></button>;
  return <button className="is-danger" type="submit" disabled={pending}>{pending ? <LoaderCircle className="spin" size={14} /> : <X size={14} />}<span>Confirmar</span></button>;
}

export default function InvitationActions({ invitationId }) {
  const [renewState, renewAction] = useActionState(renewInvitation, initialState);
  const [revokeState, revokeAction] = useActionState(revokeInvitation, initialState);
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    if (!renewState.inviteUrl) return;
    await navigator.clipboard.writeText(renewState.inviteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="invitation-actions">
      <div className="invitation-actions__buttons">
        <form action={renewAction}><input type="hidden" name="invitationId" value={invitationId} /><RenewButton /></form>
        <form action={revokeAction}><input type="hidden" name="invitationId" value={invitationId} /><RevokeButton confirming={confirming} onConfirm={() => setConfirming(true)} /></form>
        {confirming && <button type="button" onClick={() => setConfirming(false)}>Cancelar</button>}
      </div>
      {(renewState.error || revokeState.error) && <p className="form-message form-message--error" role="alert">{renewState.error || revokeState.error}</p>}
      {renewState.inviteUrl && (
        <button className="invitation-actions__copy" type="button" onClick={copyLink}>
          {copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Link copiado" : "Copiar novo link"}
        </button>
      )}
    </div>
  );
}

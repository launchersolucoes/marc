"use client";

import { Check, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { recordLegalReconsent } from "../app/app/legal-actions";

function SubmitButton({ accepted }) {
  const { pending } = useFormStatus();
  return (
    <button className="button button--primary legal-reconsent__submit" type="submit" disabled={pending || !accepted}>
      {pending && <LoaderCircle className="spin" size={17} />}
      {pending ? "Registrando aceite" : "Concordar e continuar"}
    </button>
  );
}

export default function LegalReconsentForm({ documents }) {
  const [state, action] = useActionState(recordLegalReconsent, { error: "" });
  const [accepted, setAccepted] = useState(false);

  return (
    <form action={action} className="legal-reconsent__form">
      <label className="choice-row choice-row--legal legal-reconsent__choice">
        <input type="checkbox" name="legalAcceptance" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} required />
        <span className="choice-row__check"><Check size={15} /></span>
        <span>
          <strong>Li e concordo com os documentos vigentes</strong>
          <small>
            <Link href={documents.terms.href} target="_blank" rel="noreferrer">Termos de Uso</Link>
            {" e "}
            <Link href={documents.privacy.href} target="_blank" rel="noreferrer">Política de Privacidade</Link>
          </small>
        </span>
      </label>
      {state?.error && <p className="form-message form-message--error" role="alert">{state.error}</p>}
      <SubmitButton accepted={accepted} />
      <p className="legal-reconsent__evidence">O Marc registra sua conta, estabelecimento, versões e data do aceite.</p>
    </form>
  );
}

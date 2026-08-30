"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

export default function MasterPrivacySubmit() {
  const { pending } = useFormStatus();
  return <button className="button button--secondary" type="submit" disabled={pending}>{pending ? <><LoaderCircle className="spin" size={16} /> Registrando</> : "Registrar decisão"}</button>;
}

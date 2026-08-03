"use client";

import { AlertTriangle, ArrowLeft, Home, RefreshCw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function SystemState({
  eyebrow = "Algo saiu do ritmo",
  title,
  description,
  actionLabel = "Tentar novamente",
  onRetry,
  backHref = "/",
  backLabel = "Voltar ao início",
  compact = false,
}) {
  return (
    <main className={`system-state${compact ? " system-state--compact" : ""}`}>
      <section className="system-state__card" aria-live="polite">
        <Link className="system-state__brand" href="/" aria-label="Marc, voltar ao início">
          <Image src="/assets/marc-logo-cropped.png" alt="Marc" width={208} height={90} priority />
        </Link>
        <div className="system-state__icon" aria-hidden="true"><AlertTriangle size={24} /></div>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
        <div className="system-state__actions">
          {onRetry && (
            <button className="button button--primary" type="button" onClick={onRetry}>
              <RefreshCw size={17} /> {actionLabel}
            </button>
          )}
          <Link className={`button ${onRetry ? "button--secondary" : "button--primary"}`} href={backHref}>
            {backHref === "/" ? <Home size={17} /> : <ArrowLeft size={17} />} {backLabel}
          </Link>
        </div>
        <small>Se o problema continuar, anote o horário e informe à equipe Marc.</small>
      </section>
    </main>
  );
}

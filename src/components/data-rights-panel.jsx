"use client";

import { AlertTriangle, CheckCircle2, Download, FileKey2, LoaderCircle, ShieldCheck, Trash2, X } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { closeEstablishment, requestOwnDataDeletion } from "../app/app/configuracoes/actions";

const initialState = { error: "", success: "" };

function ActionFeedback({ state }) {
  if (state.error) return <p className="form-message form-message--error" role="alert">{state.error}</p>;
  if (state.success) return <p className="form-message form-message--success" role="status"><CheckCircle2 size={16} />{state.success}</p>;
  return null;
}

function PendingButton({ children, pendingLabel, className, disabled = false }) {
  const { pending } = useFormStatus();
  return (
    <button className={className} type="submit" disabled={pending || disabled}>
      {pending ? <><LoaderCircle className="spin" size={16} /> {pendingLabel}</> : children}
    </button>
  );
}

export default function DataRightsPanel({ role, establishmentName, establishmentSlug }) {
  const [deletionState, deletionAction] = useActionState(requestOwnDataDeletion, initialState);
  const [closureState, closureAction] = useActionState(closeEstablishment, initialState);
  const [requestOpen, setRequestOpen] = useState(false);
  const [closureOpen, setClosureOpen] = useState(false);
  const [closureConfirmation, setClosureConfirmation] = useState("");
  const [closureAcknowledged, setClosureAcknowledged] = useState(false);
  const [sheetOffset, setSheetOffset] = useState(0);
  const dialogRef = useRef(null);
  const sheetStartY = useRef(0);
  const isOwner = role === "owner";

  useEffect(() => {
    if (!closureOpen) return undefined;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => dialogRef.current?.querySelector("button")?.focus());
    const onKeyDown = (event) => {
      if (event.key === "Escape") setClosureOpen(false);
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll("button:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href]")];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!dialogRef.current.contains(document.activeElement)) { event.preventDefault(); first.focus(); return; }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus?.();
    };
  }, [closureOpen]);

  function startSheetDrag(event) {
    sheetStartY.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveSheetDrag(event) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    setSheetOffset(Math.max(0, event.clientY - sheetStartY.current));
  }

  function finishSheetDrag(event) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (sheetOffset > 88) setClosureOpen(false);
    setSheetOffset(0);
  }

  return (
    <section className="data-rights-panel" aria-labelledby="dataRightsTitle">
      <header>
        <div className="settings-profile-mark"><ShieldCheck size={19} /></div>
        <div><h2 id="dataRightsTitle">Seus dados no Marc</h2><p>Consulte, corrija ou solicite a exclusão das informações ligadas ao seu acesso.</p></div>
      </header>

      <div className="data-rights-list">
        {isOwner && (
          <a className="data-rights-action" href="/api/account/export" download>
            <span><Download size={18} /><span><strong>Baixar cópia do estabelecimento</strong><small>Arquivo JSON com cadastro, equipe, clientes, agenda e financeiro.</small></span></span>
            <span>Baixar</span>
          </a>
        )}
        <button className="data-rights-action" type="button" onClick={() => setRequestOpen((current) => !current)} aria-expanded={requestOpen}>
          <span><FileKey2 size={18} /><span><strong>Solicitar exclusão dos meus dados</strong><small>O suporte verifica vínculos e obrigações de retenção antes de excluir.</small></span></span>
          <span>{requestOpen ? "Fechar" : "Solicitar"}</span>
        </button>
      </div>

      {requestOpen && (
        <form className="data-rights-request" action={deletionAction}>
          <label htmlFor="deletionDetails">Contexto para o suporte <span>opcional</span></label>
          <textarea id="deletionDetails" name="details" maxLength={600} placeholder="Explique se deseja excluir apenas seu acesso ou outros dados relacionados." />
          <ActionFeedback state={deletionState} />
          <PendingButton className="button button--secondary" pendingLabel="Registrando">Confirmar solicitação</PendingButton>
        </form>
      )}

      {isOwner && (
        <div className="account-closure-entry">
          <div><AlertTriangle size={18} /><span><strong>Encerrar este estabelecimento</strong><small>Desativa a operação, cancela horários futuros e anonimiza contatos pessoais.</small></span></div>
          <button type="button" onClick={() => { setClosureConfirmation(""); setClosureAcknowledged(false); setClosureOpen(true); }}>Revisar encerramento</button>
        </div>
      )}

      {closureOpen && (
        <div className="account-closure-layer" role="presentation">
          <button className="account-closure-backdrop" type="button" tabIndex={-1} aria-label="Fechar encerramento" onClick={() => setClosureOpen(false)} />
          <section className={`account-closure-dialog ${sheetOffset ? "is-dragging" : ""}`} role="dialog" aria-modal="true" aria-labelledby="closureTitle" ref={dialogRef} tabIndex={-1} style={sheetOffset ? { transform: `translateY(${sheetOffset}px)` } : undefined}>
            <div className="account-closure-handle" aria-hidden="true" onPointerDown={startSheetDrag} onPointerMove={moveSheetDrag} onPointerUp={finishSheetDrag} onPointerCancel={finishSheetDrag}><span /></div>
            <header><button type="button" onClick={() => setClosureOpen(false)} aria-label="Fechar"><X size={19} /></button></header>
            <div className="account-closure-mark"><Trash2 size={22} /></div>
            <h2 id="closureTitle">Encerrar {establishmentName}?</h2>
            <p>Esta ação interrompe a operação imediatamente. Para preservar obrigações financeiras e auditoria, parte do histórico permanece sem contatos pessoais.</p>
            <ul>
              <li>Horários futuros e listas de espera serão cancelados.</li>
              <li>Links da área do cliente e acessos da equipe deixarão de funcionar.</li>
              <li>Clientes e profissionais serão anonimizados.</li>
            </ul>
            <form action={closureAction}>
              <div className="field"><label htmlFor="closureConfirmation">Digite <strong>{establishmentSlug}</strong> para confirmar</label><input id="closureConfirmation" name="confirmation" autoComplete="off" value={closureConfirmation} onChange={(event) => setClosureConfirmation(event.target.value)} required /></div>
              <label className="account-closure-check"><input name="acknowledged" value="yes" type="checkbox" checked={closureAcknowledged} onChange={(event) => setClosureAcknowledged(event.target.checked)} required /><span>Baixei a cópia necessária dos dados e compreendo que a reativação dependerá do suporte.</span></label>
              <ActionFeedback state={closureState} />
              <PendingButton className="button button--danger account-closure-submit" pendingLabel="Encerrando" disabled={closureConfirmation !== establishmentSlug || !closureAcknowledged}>Encerrar estabelecimento</PendingButton>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}

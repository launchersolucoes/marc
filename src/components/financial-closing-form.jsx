"use client";

import { CheckCircle2, LoaderCircle, LockKeyhole, RotateCcw } from "lucide-react";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { closeFinancialDay, reopenFinancialDay } from "../app/app/financeiro/actions";

const initialState = { error: "", success: "" };
const methods = [
  ["cash", "Dinheiro"],
  ["pix", "Pix"],
  ["credit_card", "Crédito"],
  ["debit_card", "Débito"],
  ["other", "Outros"],
];

function money(cents) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((cents || 0) / 100);
}

function inputMoney(cents) {
  return ((cents || 0) / 100).toFixed(2).replace(".", ",");
}

function ClosingSubmit() {
  const { pending } = useFormStatus();
  return <button className="button button--primary" type="submit" disabled={pending}>{pending ? <><LoaderCircle className="spin" size={16} /> Fechando</> : <><LockKeyhole size={16} /> Concluir fechamento</>}</button>;
}

function ReopenSubmit() {
  const { pending } = useFormStatus();
  return <button className="button button--danger" type="submit" disabled={pending}>{pending ? <><LoaderCircle className="spin" size={16} /> Reabrindo</> : <><RotateCcw size={16} /> Confirmar reabertura</>}</button>;
}

export default function FinancialClosingForm({ businessDate, expected, expenseTotal, closing = null }) {
  const [closeState, closeAction] = useActionState(closeFinancialDay, initialState);
  const [reopenState, reopenAction] = useActionState(reopenFinancialDay, initialState);
  const [reopening, setReopening] = useState(false);
  const isClosed = closing?.status === "closed";
  const totals = isClosed ? closing.expected_totals : expected;
  const dateLabel = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${businessDate}T12:00:00Z`));

  return (
    <div className="closing-form">
      <div className="closing-form__intro">
        <h2>{isClosed ? `Caixa fechado em ${dateLabel}` : `Conferir ${dateLabel}`}</h2>
        <p>{isClosed ? "O retrato deste dia está preservado. Reabra apenas se precisar corrigir a conferência." : "Compare o que entrou em cada meio de pagamento com os valores registrados pelo Marc."}</p>
      </div>

      <dl className="closing-system-totals">
        {methods.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{money(totals?.[key])}</dd></div>)}
        <div className="is-expense"><dt>Saídas do dia</dt><dd>− {money(isClosed ? closing.expense_total_cents : expenseTotal)}</dd></div>
      </dl>

      {isClosed ? (
        <>
          <div className="closing-result" aria-label="Resultado da conferência">
            {methods.map(([key, label]) => {
              const difference = Number(closing.difference_totals?.[key] || 0);
              return <div key={key}><span>{label}</span><strong className={difference === 0 ? "is-ok" : "is-different"}>{difference === 0 ? "Conferido" : `${difference > 0 ? "+" : "−"} ${money(Math.abs(difference))}`}</strong></div>;
            })}
          </div>
          {closing.notes && <p className="closing-note"><strong>Observação</strong>{closing.notes}</p>}
          {reopenState.error && <p className="form-message form-message--error" role="alert">{reopenState.error}</p>}
          {reopenState.success && <p className="form-message form-message--success" role="status"><CheckCircle2 size={16} />{reopenState.success}</p>}
          {reopening ? (
            <form className="closing-reopen" action={reopenAction}>
              <input type="hidden" name="closingId" value={closing.id} />
              <div className="field"><label htmlFor="closingReopenReason">Motivo da reabertura</label><textarea id="closingReopenReason" name="reason" rows={2} minLength={3} maxLength={240} placeholder="Ex.: comprovante lançado depois do fechamento" required /></div>
              <div className="lifecycle-confirm"><ReopenSubmit /><button className="button button--quiet" type="button" onClick={() => setReopening(false)}>Manter fechado</button></div>
            </form>
          ) : <button className="button button--quiet lifecycle-trigger" type="button" onClick={() => setReopening(true)}>Reabrir este dia</button>}
        </>
      ) : (
        <form className="closing-fields" action={closeAction}>
          <input type="hidden" name="businessDate" value={businessDate} />
          {methods.map(([key, label]) => {
            const inputName = key === "credit_card" ? "creditCard" : key === "debit_card" ? "debitCard" : key;
            return <div className="field closing-value" key={key}><label htmlFor={`closing-${key}`}><span>{label}</span><small>Sistema: {money(expected?.[key])}</small></label><div className="money-field"><span>R$</span><input id={`closing-${key}`} name={inputName} inputMode="decimal" defaultValue={inputMoney(expected?.[key])} maxLength={14} required /></div></div>;
          })}
          <div className="field"><label htmlFor="closingNotes">Observação <span>opcional</span></label><textarea id="closingNotes" name="notes" rows={3} maxLength={500} placeholder="Registre alguma diferença, retirada ou comprovante pendente" /></div>
          {closeState.error && <p className="form-message form-message--error" role="alert">{closeState.error}</p>}
          {closeState.success && <p className="form-message form-message--success" role="status"><CheckCircle2 size={16} />{closeState.success}</p>}
          <ClosingSubmit />
        </form>
      )}
    </div>
  );
}

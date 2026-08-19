"use client";

import { CheckCircle2, LoaderCircle, MinusCircle, Pencil } from "lucide-react";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { createExpense, updateExpense } from "../app/app/financeiro/actions";

const initialState = { error: "", success: "" };

function Submit({ editing }) {
  const { pending } = useFormStatus();
  return (
    <button className="button button--primary expense-submit" type="submit" disabled={pending}>
      {pending ? <><LoaderCircle className="spin" size={16} /> Salvando</> : editing ? <><Pencil size={16} /> Salvar correção</> : <><MinusCircle size={16} /> Registrar saída</>}
    </button>
  );
}

export default function ExpenseForm({ defaultDateTime, expense = null }) {
  const editing = Boolean(expense);
  const [state, action] = useActionState(editing ? updateExpense : createExpense, initialState);
  const [confirmingVoid, setConfirmingVoid] = useState(false);
  return (
    <form className="expense-form" action={action}>
      <div className="appointment-form__heading">
        <div>{editing ? <Pencil size={20} /> : <MinusCircle size={20} />}</div>
        <h2>{editing ? "Corrigir saída" : "Nova saída"}</h2>
        <p>{editing ? "A correção fica registrada para manter o caixa rastreável." : "Registre despesas da operação para manter o saldo do período confiável."}</p>
      </div>
      {editing && <input type="hidden" name="expenseId" value={expense.id} />}
      <div className="field"><label htmlFor="expenseDescription">Descrição</label><input id="expenseDescription" name="description" placeholder="Ex.: compra de produtos" defaultValue={expense?.description || ""} maxLength={160} required /></div>
      <div className="field-grid">
        <div className="field"><label htmlFor="expenseCategory">Categoria</label><select id="expenseCategory" name="category" defaultValue={expense?.category || "Insumos"}><option>Insumos</option><option>Equipe</option><option>Aluguel</option><option>Marketing</option><option>Outros</option></select></div>
        <div className="field"><label htmlFor="expenseAmount">Valor</label><div className="money-field"><span>R$</span><input id="expenseAmount" name="amount" inputMode="decimal" placeholder="0,00" defaultValue={expense ? (expense.amount_cents / 100).toFixed(2).replace(".", ",") : ""} maxLength={14} required /></div></div>
      </div>
      <div className="field-grid">
        <div className="field"><label htmlFor="expensePayment">Pagamento</label><select id="expensePayment" name="paymentMethod" defaultValue={expense?.payment_method || "pix"}><option value="pix">Pix</option><option value="cash">Dinheiro</option><option value="credit_card">Crédito</option><option value="debit_card">Débito</option><option value="other">Outro</option></select></div>
        <div className="field"><label htmlFor="expenseOccurredAt">Data e hora</label><input id="expenseOccurredAt" name="occurredAt" type="datetime-local" defaultValue={defaultDateTime} required /></div>
      </div>
      {state.error && <p className="form-message form-message--error" role="alert">{state.error}</p>}
      {state.success && <p className="form-message form-message--success" role="status"><CheckCircle2 size={16} />{state.success}</p>}
      <Submit editing={editing} />
      {editing && (confirmingVoid ? (
        <div className="expense-void-confirm" role="group" aria-label="Confirmar estorno da despesa">
          <div className="field"><label htmlFor="expenseVoidReason">Motivo do estorno</label><textarea id="expenseVoidReason" name="voidReason" rows={2} minLength={3} maxLength={240} placeholder="Ex.: lançamento duplicado" required /></div>
          <p>O valor sai dos totais, mas o registro e o motivo permanecem no histórico.</p>
          <div className="lifecycle-confirm">
            <button className="button button--danger" type="submit" name="intent" value="void">Confirmar estorno</button>
            <button className="button button--quiet" type="button" onClick={() => setConfirmingVoid(false)}>Manter despesa</button>
          </div>
        </div>
      ) : <button className="button button--quiet lifecycle-trigger" type="button" onClick={() => setConfirmingVoid(true)}>Estornar despesa</button>)}
    </form>
  );
}

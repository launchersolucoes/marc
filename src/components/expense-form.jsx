"use client";

import { CheckCircle2, LoaderCircle, MinusCircle } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createExpense } from "../app/app/financeiro/actions";

const initialState = { error: "", success: "" };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button className="button button--primary expense-submit" type="submit" disabled={pending}>
      {pending ? <><LoaderCircle className="spin" size={16} /> Registrando</> : <><MinusCircle size={16} /> Registrar saída</>}
    </button>
  );
}

export default function ExpenseForm({ defaultDateTime }) {
  const [state, action] = useActionState(createExpense, initialState);
  return (
    <form className="expense-form" action={action}>
      <div className="appointment-form__heading">
        <div><MinusCircle size={20} /></div>
        <h2>Nova saída</h2>
        <p>Registre despesas da operação para manter o saldo do período confiável.</p>
      </div>
      <div className="field"><label htmlFor="expenseDescription">Descrição</label><input id="expenseDescription" name="description" placeholder="Ex.: compra de produtos" required /></div>
      <div className="field-grid">
        <div className="field"><label htmlFor="expenseCategory">Categoria</label><select id="expenseCategory" name="category" defaultValue="Insumos"><option>Insumos</option><option>Equipe</option><option>Aluguel</option><option>Marketing</option><option>Outros</option></select></div>
        <div className="field"><label htmlFor="expenseAmount">Valor</label><div className="money-field"><span>R$</span><input id="expenseAmount" name="amount" inputMode="decimal" placeholder="0,00" required /></div></div>
      </div>
      <div className="field-grid">
        <div className="field"><label htmlFor="expensePayment">Pagamento</label><select id="expensePayment" name="paymentMethod" defaultValue="pix"><option value="pix">Pix</option><option value="cash">Dinheiro</option><option value="credit_card">Crédito</option><option value="debit_card">Débito</option><option value="other">Outro</option></select></div>
        <div className="field"><label htmlFor="expenseOccurredAt">Data e hora</label><input id="expenseOccurredAt" name="occurredAt" type="datetime-local" defaultValue={defaultDateTime} required /></div>
      </div>
      {state.error && <p className="form-message form-message--error" role="alert">{state.error}</p>}
      {state.success && <p className="form-message form-message--success"><CheckCircle2 size={16} />{state.success}</p>}
      <Submit />
    </form>
  );
}

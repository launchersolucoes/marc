import {
  ArrowDownRight,
  ArrowUpRight,
  Ban,
  ChartNoAxesCombined,
  Pencil,
  ReceiptText,
  WalletCards,
} from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";
import ExpenseForm from "../../../components/expense-form";
import MobileRouteSheet from "../../../components/mobile-route-sheet";
import { getAppContext } from "../../../lib/app-context";

export const metadata = { title: "Financeiro — Marc" };

const paymentLabels = {
  cash: "Dinheiro",
  pix: "Pix",
  credit_card: "Crédito",
  debit_card: "Débito",
  other: "Outro",
};

function money(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value / 100);
}

function brazilDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Sao_Paulo",
  }).formatToParts(new Date());
  const get = (type) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

function localDateTime(value) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Sao_Paulo",
  }).formatToParts(new Date(value));
  const get = (type) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export default async function FinancePage({ searchParams }) {
  const query = await searchParams;
  const editExpenseId = typeof query?.editar === "string" ? query.editar : "";
  const { supabase, membership, establishment } = await getAppContext();
  if (!["owner", "manager"].includes(membership.role)) redirect("/app");

  const now = new Date();
  const currentMonth = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(now);
  const monthStart = `${currentMonth}-01T00:00:00-03:00`;
  const nextMonthDate = new Date(`${currentMonth}-01T12:00:00Z`);
  nextMonthDate.setUTCMonth(nextMonthDate.getUTCMonth() + 1);
  const nextMonth = `${nextMonthDate.toISOString().slice(0, 7)}-01T00:00:00-03:00`;

  const { data: entries } = await supabase
    .from("financial_entries")
    .select("id, appointment_id, type, category, description, amount_cents, payment_method, occurred_at, voided_at, void_reason")
    .eq("establishment_id", establishment.id)
    .gte("occurred_at", monthStart)
    .lt("occurred_at", nextMonth)
    .order("occurred_at", { ascending: false });

  const list = entries || [];
  const activeList = list.filter((item) => !item.voided_at);
  const income = activeList.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount_cents, 0);
  const expense = activeList.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount_cents, 0);
  const balance = income - expense;
  const incomeCount = activeList.filter((item) => item.type === "income").length;
  const expenseCount = activeList.filter((item) => item.type === "expense").length;
  const editableExpense = list.find((item) => item.id === editExpenseId && item.type === "expense" && !item.appointment_id && !item.voided_at) || null;

  return (
      <div className="app-content finance-page">
        <header className="product-heading">
          <div>
            <span>Caixa e resultado</span>
            <h1>Financeiro</h1>
            <p>Atendimentos concluídos viram entradas automaticamente. Registre as saídas para acompanhar o saldo real.</p>
          </div>
          <Link className="button button--secondary" href="/app/relatorios"><ChartNoAxesCombined size={16} /> Ver relatórios</Link>
        </header>

        <section className="finance-summary" aria-label="Resumo financeiro do mês">
          <article><span><ArrowUpRight size={16} /> Entradas</span><strong>{money(income)}</strong><small>{incomeCount} {incomeCount === 1 ? "lançamento" : "lançamentos"}</small></article>
          <article><span><ArrowDownRight size={16} /> Saídas</span><strong>{money(expense)}</strong><small>{expenseCount} {expenseCount === 1 ? "lançamento" : "lançamentos"}</small></article>
          <article className="is-balance"><span><WalletCards size={16} /> Saldo do mês</span><strong>{money(balance)}</strong><small>Entradas menos saídas</small></article>
        </section>

        <div className="finance-layout">
          <section className="finance-ledger">
            <div className="section-title"><div><h2>Movimentações do mês</h2><p>Histórico em ordem da ocorrência, com origem e pagamento.</p></div><span>{list.length}</span></div>
            {list.length ? (
              <div className="finance-list">
                {list.map((entry) => (
                  <article className={entry.voided_at ? "is-voided" : ""} key={entry.id}>
                    <div className={`finance-entry-icon is-${entry.voided_at ? "voided" : entry.type}`}>{entry.voided_at ? <Ban size={17} /> : entry.type === "income" ? <ArrowUpRight size={17} /> : <ArrowDownRight size={17} />}</div>
                    <div><strong>{entry.description}</strong><span>{entry.voided_at ? `Estornada · ${entry.void_reason}` : `${entry.category} · ${paymentLabels[entry.payment_method] || "Não informado"}`}</span></div>
                    <time>{new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(entry.occurred_at))}</time>
                    <div className="finance-entry-actions">
                      <em className={`is-${entry.voided_at ? "voided" : entry.type}`}>{entry.voided_at ? "Estornado" : `${entry.type === "income" ? "+" : "−"} ${money(entry.amount_cents)}`}</em>
                      {entry.type === "expense" && !entry.appointment_id && !entry.voided_at && <Link href={`/app/financeiro?editar=${entry.id}`} aria-label={`Corrigir ${entry.description}`}><Pencil size={13} /> Corrigir</Link>}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="finance-empty"><ReceiptText size={26} /><h2>O caixa começa com o primeiro atendimento.</h2><p>Conclua um atendimento na agenda ou registre uma saída para iniciar o histórico financeiro.</p></div>
            )}
          </section>
          {!editableExpense && <aside className="finance-expense-card"><ExpenseForm defaultDateTime={brazilDate()} /></aside>}
          {editableExpense && <MobileRouteSheet className="finance-expense-card finance-edit-sheet" open closeHref="/app/financeiro" title="Corrigir saída">
            <ExpenseForm expense={editableExpense} defaultDateTime={localDateTime(editableExpense.occurred_at)} />
          </MobileRouteSheet>}
        </div>
      </div>
  );
}

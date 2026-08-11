import {
  BadgeDollarSign,
  CalendarCheck2,
  CircleDollarSign,
  Percent,
  UserRound,
} from "lucide-react";
import { redirect } from "next/navigation";
import CommissionForm from "../../../components/commission-form";
import { getAppContext } from "../../../lib/app-context";

export const metadata = { title: "Comissões — Marc" };

function money(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value / 100);
}

function monthBounds() {
  const currentMonth = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
  const nextMonthDate = new Date(`${currentMonth}-01T12:00:00Z`);
  nextMonthDate.setUTCMonth(nextMonthDate.getUTCMonth() + 1);
  return {
    start: `${currentMonth}-01T00:00:00-03:00`,
    end: `${nextMonthDate.toISOString().slice(0, 7)}-01T00:00:00-03:00`,
  };
}

export default async function CommissionsPage() {
  const { supabase, user, membership, establishment, professional } = await getAppContext();
  const canManage = ["owner", "manager"].includes(membership.role);
  if (!canManage && membership.role !== "professional") redirect("/app");
  if (!canManage && !professional) redirect("/app/equipe");

  const bounds = monthBounds();
  let entriesQuery = supabase
    .from("financial_entries")
    .select("id, amount_cents, commission_percent, commission_amount_cents, occurred_at, professional:professionals(id, display_name, color)")
    .eq("establishment_id", establishment.id)
    .eq("type", "income")
    .gte("occurred_at", bounds.start)
    .lt("occurred_at", bounds.end)
    .order("occurred_at", { ascending: false });

  if (!canManage) entriesQuery = entriesQuery.eq("professional_id", professional.id);

  const [{ data: entries }, professionalsResult] = await Promise.all([
    entriesQuery,
    canManage
      ? supabase
          .from("professionals")
          .select("id, display_name, color, commission_percent, is_active")
          .eq("establishment_id", establishment.id)
          .eq("is_active", true)
          .order("display_name")
      : Promise.resolve({ data: [] }),
  ]);

  const list = entries || [];
  const revenue = list.reduce((sum, entry) => sum + entry.amount_cents, 0);
  const commissions = list.reduce((sum, entry) => sum + entry.commission_amount_cents, 0);
  const establishmentShare = revenue - commissions;
  const byProfessional = new Map();

  list.forEach((entry) => {
    const id = entry.professional?.id || "unassigned";
    const current = byProfessional.get(id) || {
      id,
      name: entry.professional?.display_name || "Sem profissional",
      color: entry.professional?.color || "#ffa500",
      appointments: 0,
      revenue: 0,
      commission: 0,
    };
    current.appointments += 1;
    current.revenue += entry.amount_cents;
    current.commission += entry.commission_amount_cents;
    byProfessional.set(id, current);
  });

  const breakdown = [...byProfessional.values()].sort((a, b) => b.commission - a.commission);

  return (
      <div className="app-content commissions-page">
        <header className="product-heading">
          <div>
            <span>{canManage ? "Resultado da equipe" : "Seu resultado"}</span>
            <h1>Comissões</h1>
            <p>
              {canManage
                ? "Acompanhe quanto cada profissional gerou e o valor reservado para pagamento neste mês."
                : "Veja os atendimentos concluídos e a comissão acumulada no mês."}
            </p>
          </div>
        </header>

        <section className={`commission-summary ${canManage ? "" : "commission-summary--personal"}`} aria-label="Resumo de comissões do mês">
          <article><span><CircleDollarSign size={16} /> Faturamento atendido</span><strong>{money(revenue)}</strong><small>{list.length} {list.length === 1 ? "atendimento concluído" : "atendimentos concluídos"}</small></article>
          <article className="is-commission"><span><BadgeDollarSign size={16} /> Comissões</span><strong>{money(commissions)}</strong><small>{canManage ? "Valor reservado para a equipe" : "Seu valor acumulado"}</small></article>
          {canManage && <article><span><CalendarCheck2 size={16} /> Parte do estabelecimento</span><strong>{money(establishmentShare)}</strong><small>Após descontar comissões</small></article>}
        </section>

        <div className={`commissions-layout ${canManage ? "" : "commissions-layout--single"}`}>
          <section className="commission-breakdown">
            <div className="section-title">
              <div><h2>{canManage ? "Resultado por profissional" : "Histórico do mês"}</h2><p>Valores calculados com a taxa registrada na conclusão de cada atendimento.</p></div>
              <span>{breakdown.length}</span>
            </div>
            {breakdown.length ? (
              <div className="commission-list">
                {breakdown.map((item) => (
                  <article key={item.id}>
                    <span className="commission-avatar" style={{ "--team-color": item.color }}>{item.name.slice(0, 1).toUpperCase()}</span>
                    <div><strong>{item.name}</strong><small>{item.appointments} {item.appointments === 1 ? "atendimento" : "atendimentos"} · {money(item.revenue)} gerados</small></div>
                    <em>{money(item.commission)}</em>
                  </article>
                ))}
              </div>
            ) : (
              <div className="commission-empty"><Percent size={27} /><h2>As comissões começam com um atendimento concluído.</h2><p>Quando um serviço for finalizado, o Marc registra a taxa vigente e calcula o valor automaticamente.</p></div>
            )}
          </section>

          {canManage && (
            <aside className="commission-settings">
              <div className="section-title">
                <div><h2>Taxas da equipe</h2><p>Alterações valem somente para os próximos atendimentos.</p></div>
                <UserRound size={18} />
              </div>
              <div className="commission-settings__list">
                {(professionalsResult.data || []).map((item) => <CommissionForm key={item.id} professional={item} />)}
              </div>
              {!professionalsResult.data?.length && <p className="inline-note">Cadastre um profissional para definir a primeira taxa.</p>}
            </aside>
          )}
        </div>
      </div>
  );
}

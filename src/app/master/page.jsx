import { Building2, CalendarClock, ExternalLink, LogOut, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "../auth/actions";
import { updateEstablishmentSubscription } from "./actions";
import { getPlatformAdminContext } from "../../lib/platform-admin-context";
import { subscriptionPlanLabels, subscriptionStatusLabels } from "../../lib/subscription";

export const metadata = { title: "Master — Marc" };

function dateLabel(value) {
  if (!value) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeZone: "America/Sao_Paulo" }).format(new Date(value));
}

function accessDate(item) {
  if (item.subscription_status === "trialing") return item.trial_ends_at;
  if (item.subscription_status === "past_due") return item.grace_period_ends_at;
  return item.current_period_ends_at;
}

export default async function MasterPage({ searchParams }) {
  const params = await searchParams;
  const { supabase, user } = await getPlatformAdminContext();
  const { data, error } = await supabase.rpc("get_platform_admin_overview");
  const establishments = data || [];
  const activeSubscriptions = establishments.filter((item) => ["trialing", "active", "past_due"].includes(item.subscription_status)).length;
  const totalProfessionals = establishments.reduce((sum, item) => sum + Number(item.professionals_count || 0), 0);

  return (
    <main className="master-page">
      <header className="master-header">
        <Link href="/master" className="master-brand"><Image src="/assets/marc-logo-cropped.png" alt="Marc" width={208} height={90} priority /><span>Master</span></Link>
        <div>
          <Link href="/" target="_blank">Ver site <ExternalLink size={15} /></Link>
          <span>{user.email}</span>
          <form action={signOut}><button type="submit"><LogOut size={17} /> Sair</button></form>
        </div>
      </header>

      <section className="master-content">
        <div className="master-heading">
          <div><span>Launcher · administração global</span><h1>Visão da plataforma</h1><p>Acompanhe estabelecimentos e libere acessos enquanto a cobrança automática não está conectada.</p></div>
          <div className="master-security"><ShieldCheck size={19} /><span><strong>Acesso restrito</strong><small>Somente administradores da Launcher</small></span></div>
        </div>

        {params?.atualizado && <p className="master-message master-message--success">Assinatura atualizada e registrada no histórico.</p>}
        {params?.erro && <p className="master-message master-message--error">{params.erro}</p>}
        {error && <p className="master-message master-message--error">Não foi possível carregar os dados globais.</p>}

        <div className="master-stats">
          <article><Building2 size={20} /><span>Estabelecimentos</span><strong>{establishments.length}</strong></article>
          <article><CalendarClock size={20} /><span>Acessos vigentes</span><strong>{activeSubscriptions}</strong></article>
          <article><UsersRound size={20} /><span>Profissionais</span><strong>{totalProfessionals}</strong></article>
        </div>

        <section className="master-panel">
          <div className="master-panel__heading"><div><span>Operação comercial</span><h2>Estabelecimentos</h2></div><small>{establishments.length} cadastrados</small></div>

          {establishments.length === 0 ? (
            <div className="master-empty"><Sparkles size={24} /><h3>Nenhum estabelecimento ainda</h3><p>Os primeiros cadastros aparecerão aqui automaticamente com 14 dias de teste.</p></div>
          ) : (
            <div className="master-establishments">
              {establishments.map((item) => (
                <article key={item.establishment_id}>
                  <div className="master-establishment__identity">
                    <span>{item.establishment_name.slice(0, 1).toUpperCase()}</span>
                    <div><strong>{item.establishment_name}</strong><small>/{item.slug} · criado em {dateLabel(item.created_at)}</small></div>
                  </div>
                  <div className="master-establishment__metrics">
                    <span><strong>{item.members_count}</strong> membros</span>
                    <span><strong>{item.professionals_count}</strong> profissionais</span>
                    <span><strong>{item.appointments_count}</strong> agendamentos</span>
                  </div>
                  <div className="master-establishment__status">
                    <strong>{subscriptionStatusLabels[item.subscription_status] || "Não configurada"}</strong>
                    <span>{subscriptionPlanLabels[item.plan_code] || "Starter"} · acesso até {dateLabel(accessDate(item))}</span>
                  </div>
                  <form action={updateEstablishmentSubscription} className="master-subscription-form">
                    <input type="hidden" name="establishmentId" value={item.establishment_id} />
                    <label>Plano<select name="planCode" defaultValue={item.plan_code || "starter"}><option value="starter">Starter</option><option value="pro">Pro</option><option value="max">Max</option></select></label>
                    <label>Status<select name="status" defaultValue={item.subscription_status || "trialing"}><option value="trialing">Teste</option><option value="active">Ativa</option><option value="past_due">Pendente</option><option value="canceled">Cancelada</option><option value="expired">Encerrada</option></select></label>
                    <label>Dias<input name="accessDays" type="number" min="1" max="365" defaultValue="30" required /></label>
                    <button className="button button--primary" type="submit">Atualizar acesso</button>
                  </form>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

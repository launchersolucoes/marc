import { CalendarClock, Check, CreditCard, Database, LockKeyhole, ShieldCheck } from "lucide-react";
import AppShell from "../../../components/app-shell";
import { subscriptionPlanLabels, subscriptionStatusLabels } from "../../../lib/subscription";
import { getAppContext } from "../../../lib/app-context";

export const metadata = { title: "Plano e assinatura — Marc" };

function dateLabel(value) {
  if (!value) return "Sem data definida";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

export default async function SubscriptionPage() {
  const { user, membership, subscription, subscriptionAccess } = await getAppContext({ allowRestricted: true });
  const canManage = ["owner", "manager"].includes(membership.role);
  const status = subscriptionAccess.effectiveStatus;
  const isLocked = !subscriptionAccess.canAccess;
  const accessDate = subscriptionAccess.accessEndsAt || subscription?.trial_ends_at || subscription?.current_period_ends_at;

  return (
    <AppShell active="assinatura" membership={membership} user={user} allowRestricted>
      <div className="app-content subscription-page">
        <header className="product-heading">
          <div>
            <span>Plano e acesso</span>
            <h1>{isLocked ? "Seu acesso está pausado." : "Assinatura do Marc"}</h1>
            <p>{isLocked
              ? "A agenda e os dados continuam preservados. Ative a assinatura para retomar a operação."
              : "Acompanhe o período de teste e o estado comercial do estabelecimento."}</p>
          </div>
          <div className={`heading-stat ${isLocked ? "heading-stat--warning" : ""}`}>
            {isLocked ? <LockKeyhole size={18} /> : <ShieldCheck size={18} />}
            <strong>{subscriptionStatusLabels[status] || "Configuração pendente"}</strong>
            <span>{subscriptionPlanLabels[subscription?.plan_code] || "Plano inicial"}</span>
          </div>
        </header>

        <div className="subscription-layout">
          <section className="subscription-summary">
            <div className="subscription-summary__icon"><CreditCard size={24} /></div>
            <span>Plano atual</span>
            <h2>{subscriptionPlanLabels[subscription?.plan_code] || "Starter"}</h2>
            <p>As condições comerciais e os limites definitivos serão confirmados antes da cobrança.</p>

            <dl>
              <div><dt>Status</dt><dd>{subscriptionStatusLabels[status] || "Não configurado"}</dd></div>
              <div><dt>{status === "trialing" ? "Fim do teste" : "Acesso até"}</dt><dd>{dateLabel(accessDate)}</dd></div>
              {subscriptionAccess.daysRemaining !== null && subscriptionAccess.canAccess && (
                <div><dt>Dias restantes</dt><dd>{subscriptionAccess.daysRemaining}</dd></div>
              )}
            </dl>

            {canManage ? (
              <a
                className="button button--primary subscription-contact"
                href="mailto:launchersolucoes@gmail.com?subject=Ativar%20assinatura%20do%20Marc"
              >
                {isLocked ? "Solicitar ativação" : "Falar sobre a assinatura"}
              </a>
            ) : (
              <div className="subscription-leadership-note">
                <LockKeyhole size={18} />
                <p><strong>A assinatura é gerenciada pela liderança.</strong><span>Procure o dono ou gerente do estabelecimento para regularizar o acesso.</span></p>
              </div>
            )}
          </section>

          <aside className="subscription-assurances">
            <div><Database size={19} /><span><strong>Seus dados permanecem seguros</strong><small>Agenda, clientes e histórico não são apagados quando o acesso pausa.</small></span></div>
            <div><CalendarClock size={19} /><span><strong>7 dias para testar a operação</strong><small>O período começa quando o estabelecimento é criado.</small></span></div>
            <div><Check size={19} /><span><strong>Sem cobrança automática agora</strong><small>A integração com o provedor será ativada somente após a definição comercial.</small></span></div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

import { AlertTriangle, ArrowRight, CalendarClock } from "lucide-react";
import Link from "next/link";

export default function SubscriptionNotice({ access, role }) {
  if (!access?.canAccess || !["trialing", "past_due"].includes(access.effectiveStatus)) return null;

  const canManage = ["owner", "manager"].includes(role);
  const isTrial = access.effectiveStatus === "trialing";
  const days = access.daysRemaining ?? 0;
  const message = isTrial
    ? days <= 1
      ? "Termina hoje"
      : `${days} dias restantes`
    : days <= 1
      ? "O prazo para regularizar a assinatura termina hoje."
      : `Pagamento pendente. O acesso permanece liberado por mais ${days} dias.`;

  return (
    <aside className={`subscription-notice ${isTrial ? "" : "subscription-notice--warning"}`}>
      {isTrial ? <CalendarClock size={18} /> : <AlertTriangle size={18} />}
      <p><strong>{isTrial ? "Teste gratuito" : "Assinatura pendente"}</strong><span>{message}</span></p>
      {canManage
        ? <Link href="/app/assinatura">Ver plano <ArrowRight size={15} /></Link>
        : <span className="subscription-notice__owner">Fale com a liderança do estabelecimento.</span>}
    </aside>
  );
}

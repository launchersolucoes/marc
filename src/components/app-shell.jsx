import {
  CalendarDays,
  ChartNoAxesCombined,
  CircleHelp,
  CircleDollarSign,
  CreditCard,
  LayoutDashboard,
  LogOut,
  ListTodo,
  Menu,
  Percent,
  Plus,
  Scissors,
  Settings,
  UserRound,
  UsersRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { signOut } from "../app/auth/actions";
import AppNavigationProgress from "./app-navigation-progress";
import AppThemeToggle from "./app-theme-toggle";
import SubscriptionNotice from "./subscription-notice";

const roleLabels = {
  owner: "Dono",
  manager: "Gerente",
  receptionist: "Recepção",
  professional: "Profissional",
};

const navigationGroups = [
  ["Operação", [
    ["home", "/app", LayoutDashboard, "Visão geral"],
    ["agenda", "/app/agenda", CalendarDays, "Agenda"],
    ["lista-espera", "/app/lista-espera", ListTodo, "Lista de espera"],
  ]],
  ["Relacionamento", [
    ["clientes", "/app/clientes", UsersRound, "Clientes"],
    ["servicos", "/app/servicos", Scissors, "Serviços"],
    ["equipe", "/app/equipe", UserRound, "Equipe"],
  ]],
  ["Gestão", [
    ["financeiro", "/app/financeiro", CircleDollarSign, "Financeiro"],
    ["comissoes", "/app/comissoes", Percent, "Comissões"],
    ["relatorios", "/app/relatorios", ChartNoAxesCombined, "Relatórios"],
  ]],
];

export default function AppShell({ active, membership, user, children, allowRestricted = false }) {
  const establishment = membership.establishment;
  const firstName =
    user.user_metadata?.full_name?.split(" ")[0] ||
    user.email?.split("@")[0] ||
    "M";
  const canSeeNavigationItem = ([key]) =>
    (key !== "financeiro" || ["owner", "manager"].includes(membership.role)) &&
    (key !== "comissoes" || ["owner", "manager", "professional"].includes(membership.role)) &&
    (key !== "relatorios" || ["owner", "manager"].includes(membership.role));
  const visibleGroups = navigationGroups
    .map(([label, items]) => [label, items.filter(canSeeNavigationItem)])
    .filter(([, items]) => items.length);
  const visibleNavigation = visibleGroups.flatMap(([, items]) => items);
  const primaryMobileKeys = ["home", "agenda", "clientes", "servicos"];
  const mobileNavigation = visibleNavigation.filter(([key]) => primaryMobileKeys.includes(key));
  const mobileSecondaryNavigation = visibleNavigation.filter(([key]) => !primaryMobileKeys.includes(key));
  const secondaryActive = mobileSecondaryNavigation.some(([key]) => key === active) || ["assinatura", "configuracoes"].includes(active);

  return (
    <main className="app-layout">
      <Suspense fallback={null}><AppNavigationProgress /></Suspense>
      <aside className="app-sidebar">
        <Link className="app-brand" href="/app">
          <Image src="/assets/marc-logo-cropped.png" alt="Marc" width={208} height={90} priority />
        </Link>
        <nav aria-label="Navegação do painel">
          {visibleGroups.map(([groupLabel, items]) => (
            <div className="app-sidebar__group" key={groupLabel}>
              <span>{groupLabel}</span>
              {items.map(([key, href, Icon, label]) => (
                <Link className={active === key ? "is-active" : ""} href={href} key={key}>
                  <Icon size={19} /> {label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="app-sidebar__bottom">
          {["owner", "manager"].includes(membership.role) && (
            <Link className={active === "assinatura" ? "is-active" : ""} href="/app/assinatura"><CreditCard size={19} /> Plano e assinatura</Link>
          )}
          <Link className={active === "configuracoes" ? "is-active" : ""} href="/app/configuracoes"><Settings size={19} /> Configurações</Link>
          <a href="mailto:launchersolucoes@gmail.com?subject=Ajuda%20com%20o%20Marc"><CircleHelp size={19} /> Ajuda</a>
          <form action={signOut}><button type="submit"><LogOut size={19} /> Sair</button></form>
        </div>
      </aside>

      <section className="app-main">
        <header className="app-topbar">
          <div className="business-switcher">
            <span>{establishment.name.slice(0, 1).toUpperCase()}</span>
            <div><strong>{establishment.name}</strong><small>{roleLabels[membership.role]}</small></div>
          </div>
          <div className="app-topbar__actions">
            <details className="app-quick-actions">
              <summary><Plus size={17} /> <span>Ações rápidas</span></summary>
              <div>
                <Link href="/app/agenda?novo=1"><CalendarDays size={17} /><span><strong>Novo agendamento</strong><small>Abrir a agenda e cadastrar um horário</small></span></Link>
                <Link href="/app/clientes?novo=1"><UserRound size={17} /><span><strong>Novo cliente</strong><small>Cadastrar um contato rapidamente</small></span></Link>
                <Link href="/app/servicos?novo=1"><Scissors size={17} /><span><strong>Novo serviço</strong><small>Definir valor e duração</small></span></Link>
              </div>
            </details>
            <AppThemeToggle />
            <div className="app-avatar">{firstName.slice(0, 1).toUpperCase()}</div>
          </div>
        </header>
        {!allowRestricted && <SubscriptionNotice access={membership.subscriptionAccess} role={membership.role} />}
        {children}
      </section>

      <nav className="app-mobile-nav" aria-label="Navegação principal">
        {mobileNavigation.map(([key, href, Icon, label]) => (
          <Link className={active === key ? "is-active" : ""} href={href} key={key}>
            <Icon size={20} /><span>{label === "Visão geral" ? "Início" : label}</span>
          </Link>
        ))}
        <details className={`app-mobile-more ${secondaryActive ? "is-active" : ""}`}>
          <summary aria-label="Abrir mais opções"><Menu size={20} /><span>Mais</span></summary>
          <div>
            {mobileSecondaryNavigation.map(([key, href, Icon, label]) => (
              <Link className={active === key ? "is-active" : ""} href={href} key={key}><Icon size={19} /> {label}</Link>
            ))}
            {["owner", "manager"].includes(membership.role) && <Link className={active === "assinatura" ? "is-active" : ""} href="/app/assinatura"><CreditCard size={19} /> Plano e assinatura</Link>}
            <Link className={active === "configuracoes" ? "is-active" : ""} href="/app/configuracoes"><Settings size={19} /> Configurações</Link>
            <a href="mailto:launchersolucoes@gmail.com?subject=Ajuda%20com%20o%20Marc"><CircleHelp size={19} /> Ajuda</a>
          </div>
        </details>
      </nav>
    </main>
  );
}

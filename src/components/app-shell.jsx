import {
  CalendarDays,
  CircleDollarSign,
  LayoutDashboard,
  LogOut,
  Percent,
  Scissors,
  Settings,
  UserRound,
  UsersRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "../app/auth/actions";
import AppThemeToggle from "./app-theme-toggle";

const roleLabels = {
  owner: "Dono",
  manager: "Gerente",
  receptionist: "Recepção",
  professional: "Profissional",
};

const navigation = [
  ["home", "/app", LayoutDashboard, "Visão geral"],
  ["agenda", "/app/agenda", CalendarDays, "Agenda"],
  ["clientes", "/app/clientes", UsersRound, "Clientes"],
  ["servicos", "/app/servicos", Scissors, "Serviços"],
  ["equipe", "/app/equipe", UserRound, "Equipe"],
  ["financeiro", "/app/financeiro", CircleDollarSign, "Financeiro"],
  ["comissoes", "/app/comissoes", Percent, "Comissões"],
];

export default function AppShell({ active, membership, user, children }) {
  const establishment = membership.establishment;
  const firstName =
    user.user_metadata?.full_name?.split(" ")[0] ||
    user.email?.split("@")[0] ||
    "M";
  const visibleNavigation = navigation.filter(([key]) =>
    (key !== "financeiro" || ["owner", "manager"].includes(membership.role)) &&
    (key !== "comissoes" || ["owner", "manager", "professional"].includes(membership.role))
  );
  const mobileNavigation = visibleNavigation.filter(([key]) =>
    ["home", "agenda", "clientes", "servicos", membership.role === "professional" ? "comissoes" : "financeiro"].includes(key)
  );

  return (
    <main className="app-layout">
      <aside className="app-sidebar">
        <Link className="app-brand" href="/app">
          <Image src="/assets/marc-logo-cropped.png" alt="Marc" width={208} height={90} priority />
        </Link>
        <nav aria-label="Navegação do painel">
          {visibleNavigation.map(([key, href, Icon, label]) => (
            <Link className={active === key ? "is-active" : ""} href={href} key={key}>
              <Icon size={19} /> {label}
            </Link>
          ))}
        </nav>
        <div className="app-sidebar__bottom">
          <Link className={active === "configuracoes" ? "is-active" : ""} href="/app/configuracoes"><Settings size={19} /> Configurações</Link>
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
            <AppThemeToggle />
            <div className="app-avatar">{firstName.slice(0, 1).toUpperCase()}</div>
          </div>
        </header>
        {children}
      </section>

      <nav className="app-mobile-nav" aria-label="Navegação rápida">
        {mobileNavigation.map(([key, href, Icon, label]) => (
          <Link className={active === key ? "is-active" : ""} href={href} key={key}>
            <Icon size={20} /><span>{label === "Visão geral" ? "Início" : label}</span>
          </Link>
        ))}
      </nav>
    </main>
  );
}

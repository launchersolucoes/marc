"use client";

import {
  CalendarDays,
  ChartNoAxesCombined,
  CircleHelp,
  CircleDollarSign,
  CreditCard,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Menu,
  Percent,
  Plus,
  Scissors,
  Settings,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
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

function ActionSheet({ open, title, onClose, children, className = "" }) {
  const dialogRef = useRef(null);
  const dragStart = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);
  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => dialogRef.current?.focus());
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll("button:not([disabled]), a[href]")];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (document.activeElement === dialogRef.current) { event.preventDefault(); (event.shiftKey ? last : first).focus(); return; }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  const beginDrag = (event) => {
    dragStart.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveDrag = (event) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) setDragOffset(Math.max(0, event.clientY - dragStart.current));
  };
  const endDrag = (event) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (dragOffset > 80) onClose();
    setDragOffset(0);
  };
  return (
    <div className={`app-action-sheet-layer ${className}`}>
      <button className="app-action-sheet__backdrop" type="button" aria-label="Fechar" onClick={onClose} />
      <section className={`app-action-sheet ${dragOffset ? "is-dragging" : ""}`} role="dialog" aria-modal="true" aria-label={title} ref={dialogRef} tabIndex={-1} style={dragOffset ? { transform: `translateY(${dragOffset}px)` } : undefined}>
        <div className="app-action-sheet__handle" aria-hidden="true" onPointerDown={beginDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} />
        <header>
          <button type="button" onClick={onClose}>Cancelar</button>
          <h2>{title}</h2>
          <button className="app-action-sheet__close" type="button" aria-label="Fechar" onClick={onClose}><X size={19} /></button>
        </header>
        {children}
      </section>
    </div>
  );
}

export default function AppShell({ membership, firstName, children }) {
  const pathname = usePathname();
  const [openSheet, setOpenSheet] = useState(null);
  const establishment = membership.establishment;
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
  const activeKey = pathname === "/app"
    ? "home"
    : pathname.split("/")[2] || "home";
  const secondaryActive = mobileSecondaryNavigation.some(([key]) => key === activeKey) || ["assinatura", "configuracoes"].includes(activeKey);

  useEffect(() => {
    setOpenSheet(null);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  const closeSheet = () => setOpenSheet(null);
  const createActions = [
    ["/app/agenda?novo=1", CalendarDays, "Novo atendimento", "Reservar um horário na agenda"],
    ["/app/clientes?novo=1", UserRound, "Novo cliente", "Cadastrar um contato"],
    ["/app/servicos?novo=1", Scissors, "Novo serviço", "Definir valor e duração"],
  ];

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
                <Link className={activeKey === key ? "is-active" : ""} href={href} key={key}>
                  <Icon size={19} /> {label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="app-sidebar__bottom">
          {["owner", "manager"].includes(membership.role) && (
            <Link className={activeKey === "assinatura" ? "is-active" : ""} href="/app/assinatura"><CreditCard size={19} /> Plano e assinatura</Link>
          )}
          <Link className={activeKey === "configuracoes" ? "is-active" : ""} href="/app/configuracoes"><Settings size={19} /> Configurações</Link>
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
            <button className="app-quick-actions-trigger" type="button" aria-label="Criar novo" aria-expanded={openSheet === "create"} onClick={() => setOpenSheet(openSheet === "create" ? null : "create")}>
              <Plus size={18} /><span>Ações rápidas</span>
            </button>
            <AppThemeToggle />
            <div className="app-avatar">{firstName.slice(0, 1).toUpperCase()}</div>
          </div>
        </header>
        {pathname !== "/app/assinatura" && <SubscriptionNotice access={membership.subscriptionAccess} role={membership.role} />}
        <div className="app-view-transition" key={pathname}>{children}</div>
      </section>

      <nav className="app-mobile-nav" aria-label="Navegação principal">
        {mobileNavigation.map(([key, href, Icon, label]) => (
          <Link className={activeKey === key ? "is-active" : ""} href={href} key={key} aria-current={activeKey === key ? "page" : undefined}>
            <Icon size={21} strokeWidth={activeKey === key ? 2.4 : 1.8} /><span>{label === "Visão geral" ? "Início" : label}</span>
          </Link>
        ))}
        <button className={`app-mobile-more-trigger ${secondaryActive ? "is-active" : ""}`} type="button" aria-expanded={openSheet === "more"} onClick={() => setOpenSheet(openSheet === "more" ? null : "more")}>
          <Menu size={21} /><span>Mais</span>
        </button>
      </nav>

      <ActionSheet open={openSheet === "create"} title="Criar novo" onClose={closeSheet} className="is-create-sheet">
        <div className="app-action-list">
          {createActions.map(([href, Icon, label, description]) => (
            <Link href={href} key={href} onClick={closeSheet}><span><Icon size={21} /></span><div><strong>{label}</strong><small>{description}</small></div></Link>
          ))}
        </div>
      </ActionSheet>

      <ActionSheet open={openSheet === "more"} title="Mais" onClose={closeSheet} className="is-more-sheet">
        <nav className="app-action-list" aria-label="Mais opções">
          {mobileSecondaryNavigation.map(([key, href, Icon, label]) => (
            <Link className={activeKey === key ? "is-active" : ""} href={href} key={key} onClick={closeSheet}><span><Icon size={21} /></span><strong>{label}</strong></Link>
          ))}
          {["owner", "manager"].includes(membership.role) && <Link className={activeKey === "assinatura" ? "is-active" : ""} href="/app/assinatura" onClick={closeSheet}><span><CreditCard size={21} /></span><strong>Plano e assinatura</strong></Link>}
          <Link className={activeKey === "configuracoes" ? "is-active" : ""} href="/app/configuracoes" onClick={closeSheet}><span><Settings size={21} /></span><strong>Configurações</strong></Link>
          <a href="mailto:launchersolucoes@gmail.com?subject=Ajuda%20com%20o%20Marc"><span><CircleHelp size={21} /></span><strong>Ajuda</strong></a>
        </nav>
        <form className="app-action-sheet__signout" action={signOut}><button type="submit"><LogOut size={19} /> Sair da conta</button></form>
      </ActionSheet>
    </main>
  );
}

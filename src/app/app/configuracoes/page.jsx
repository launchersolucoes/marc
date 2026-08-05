import {
  ArrowUpRight,
  KeyRound,
  Link2,
  Settings,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import AppShell from "../../../components/app-shell";
import {
  EstablishmentSettingsForm,
  ProfileSettingsForm,
} from "../../../components/settings-forms";
import { getAppContext } from "../../../lib/app-context";

export const metadata = { title: "Configurações — Marc" };

export default async function SettingsPage({ searchParams }) {
  const query = await searchParams;
  const { supabase, user, membership, establishment } = await getAppContext();
  const [{ data: fullEstablishment }, { data: profile }] = await Promise.all([
    supabase
      .from("establishments")
      .select("id, name, slug, category, phone, email, address_line, address_number, address_complement, neighborhood, city, state, postal_code")
      .eq("id", establishment.id)
      .single(),
    supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const canManage = ["owner", "manager"].includes(membership.role);

  return (
    <AppShell active="configuracoes" membership={membership} user={user}>
      <div className="app-content settings-page">
        <header className="product-heading">
          <div>
            <span>Preferências e identidade</span>
            <h1>Configurações</h1>
            <p>Mantenha os dados públicos do negócio e a segurança do seu acesso em dia.</p>
          </div>
          <div className="heading-stat"><Settings size={18} /><strong>{canManage ? "Gestão" : "Perfil"}</strong><span>Escopo do seu acesso</span></div>
        </header>

        {query?.senha === "alterada" && <p className="form-message form-message--success settings-page-message"><ShieldCheck size={17} />Senha atualizada com segurança.</p>}

        <div className={`settings-layout ${canManage ? "" : "settings-layout--profile"}`}>
          {canManage && (
            <section className="settings-primary">
              <EstablishmentSettingsForm establishment={fullEstablishment || establishment} />
            </section>
          )}

          <aside className="settings-aside">
            <ProfileSettingsForm profile={profile} email={user.email} />
            <section className="settings-access">
              <div className="settings-profile-mark"><KeyRound size={19} /></div>
              <h2>Segurança do acesso</h2>
              <p>Troque sua senha sempre que suspeitar de acesso indevido.</p>
              <Link className="button button--secondary" href="/nova-senha">Alterar minha senha</Link>
            </section>
            <section className="settings-public-link">
              <div><Link2 size={17} /><span><strong>Página pública</strong><small>/agendar/{establishment.slug}</small></span></div>
              <Link href={`/agendar/${establishment.slug}`} target="_blank">Abrir <ArrowUpRight size={15} /></Link>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

import {
  ArrowUpRight,
  Check,
  FileCheck2,
  KeyRound,
  Link2,
  Settings,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import {
  BookingRulesForm,
  EstablishmentSettingsForm,
  ProfileSettingsForm,
} from "../../../components/settings-forms";
import PwaInstallCard from "../../../components/pwa-install-card";
import DataRightsPanel from "../../../components/data-rights-panel";
import { getAppContext } from "../../../lib/app-context";
import { currentLegalDocuments, hasCurrentLegalAcceptance } from "../../../lib/legal-documents";
import { recordLegalAcceptance } from "./actions";

export const metadata = { title: "Configurações — Marc" };

export default async function SettingsPage({ searchParams }) {
  const query = await searchParams;
  const { supabase, user, membership, establishment } = await getAppContext();
  const [{ data: fullEstablishment }, { data: profile }, { data: legalAcceptances }] = await Promise.all([
    supabase
      .from("establishments")
      .select("id, name, slug, category, phone, email, address_line, address_number, address_complement, neighborhood, city, state, postal_code, min_booking_notice_minutes, max_booking_days, cancellation_notice_minutes, booking_confirmation_mode")
      .eq("id", establishment.id)
      .single(),
    supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("legal_document_acceptances")
      .select("document_type, document_version, accepted_at")
      .eq("user_id", user.id)
      .or(`establishment_id.eq.${establishment.id},establishment_id.is.null`)
      .order("accepted_at", { ascending: false }),
  ]);

  const canManage = ["owner", "manager"].includes(membership.role);
  const legalAccepted = hasCurrentLegalAcceptance(legalAcceptances || []);
  const latestLegalAcceptance = legalAcceptances?.[0]?.accepted_at || null;

  return (
      <div className="app-content settings-page">
        <header className="product-heading">
          <div>
            <h1>Configurações</h1>
            <p>Mantenha os dados públicos do negócio e a segurança do seu acesso em dia.</p>
          </div>
          <div className="heading-stat"><Settings size={18} /><strong>{canManage ? "Gestão" : "Perfil"}</strong><span>Escopo do seu acesso</span></div>
        </header>

        {query?.senha === "alterada" && <p className="form-message form-message--success settings-page-message"><ShieldCheck size={17} />Senha atualizada com segurança.</p>}
        {query?.legal === "accepted" && <p className="form-message form-message--success settings-page-message"><FileCheck2 size={17} />Documentos vigentes aceitos e registrados.</p>}
        {query?.legal === "required" && <p className="form-message form-message--error settings-page-message">Marque a confirmação para registrar o aceite.</p>}
        {query?.legal === "error" && <p className="form-message form-message--error settings-page-message">Não foi possível registrar. Recarregue para conferir as versões vigentes.</p>}

        <div className={`settings-layout ${canManage ? "" : "settings-layout--profile"}`}>
          {canManage && (
            <section className="settings-primary">
              <EstablishmentSettingsForm establishment={fullEstablishment || establishment} />
              <div className="settings-form-separator" />
              <BookingRulesForm establishment={fullEstablishment || establishment} />
            </section>
          )}

          <aside className="settings-aside">
            <ProfileSettingsForm profile={profile} email={user.email} />
            <PwaInstallCard />
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
            <section className={`settings-legal ${legalAccepted ? "is-current" : ""}`}>
              <header>
                <div className="settings-profile-mark"><FileCheck2 size={19} /></div>
                <div><h2>Documentos legais</h2><p>{legalAccepted ? "Seu aceite está atualizado." : "Confirme as versões vigentes para manter a evidência em dia."}</p></div>
              </header>
              <div className="settings-legal__documents">
                {Object.entries(currentLegalDocuments).map(([type, document]) => (
                  <Link key={type} href={document.href} target="_blank"><span>{document.title}</span><small>Versão {document.version}</small><ArrowUpRight size={14} /></Link>
                ))}
              </div>
              {legalAccepted ? (
                <div className="settings-legal__status"><ShieldCheck size={16} /><span><strong>Aceite vigente</strong>{latestLegalAcceptance && <small>Registrado em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(latestLegalAcceptance))}</small>}</span></div>
              ) : (
                <form action={recordLegalAcceptance}>
                  <label className="choice-row choice-row--legal">
                    <input type="checkbox" name="legalAcceptance" required />
                    <span className="choice-row__check"><Check size={15} /></span>
                    <span><strong>Li e concordo com as versões acima</strong><small>Registraremos sua conta, estabelecimento, versões e data.</small></span>
                  </label>
                  <button className="button button--primary" type="submit">Registrar aceite</button>
                </form>
              )}
            </section>
            <DataRightsPanel
              role={membership.role}
              establishmentName={establishment.name}
              establishmentSlug={establishment.slug}
            />
          </aside>
        </div>
      </div>
  );
}

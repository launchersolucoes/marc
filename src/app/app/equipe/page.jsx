import { Clock3, Mail, Pencil, Phone, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import Link from "next/link";
import InviteForm from "../../../components/invite-form";
import InvitationActions from "../../../components/invitation-actions";
import MobileRouteSheet from "../../../components/mobile-route-sheet";
import ProfessionalForm from "../../../components/professional-form";
import { getAppContext } from "../../../lib/app-context";

export const metadata = { title: "Equipe — Marc" };

export default async function TeamPage({ searchParams }) {
  const query = await searchParams;
  const editProfessionalId = typeof query?.editar === "string" ? query.editar : "";
  const { supabase, user, membership, establishment } = await getAppContext();
  const canManage = ["owner", "manager"].includes(membership.role);
  const [{ data: professionals }, { data: invitations }] = await Promise.all([
    supabase
      .from("professionals")
      .select("id, display_name, contact_email, contact_phone, color, user_id, is_active, commission_percent")
      .eq("establishment_id", establishment.id)
      .order("created_at"),
    canManage
      ? supabase
          .from("establishment_invitations")
          .select("id, email, role, status, expires_at, created_at")
          .eq("establishment_id", establishment.id)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);
  const unlinkedProfessionals = (professionals || []).filter((item) => !item.user_id);
  const editableProfessional = canManage ? (professionals || []).find((item) => item.id === editProfessionalId) || null : null;
  const roleLabels = { manager: "Gerente", receptionist: "Recepção", professional: "Profissional" };

  return (
      <div className="app-content team-page">
        <header className="product-heading">
          <div>
            <span>Equipe e acessos</span>
            <h1>Quem faz a agenda acontecer.</h1>
            <p>Profissionais têm agenda própria. Gerência e recepção enxergam a operação inteira.</p>
          </div>
          <div className="heading-stat"><UsersRound size={18} /><strong>{professionals?.length || 0}</strong><span>na equipe</span></div>
        </header>

        <div className={`team-layout ${canManage ? "" : "team-layout--single"}`}>
          <section className="team-roster">
            <div className="section-title"><h2>Profissionais</h2><span>{professionals?.filter((item) => item.is_active).length || 0} ativos</span></div>
            <div className="team-list">
              {professionals?.map((professional) => (
                <article key={professional.id}>
                  <div className="team-avatar" style={{ "--team-color": professional.color || "#ffa500" }}>
                    {professional.display_name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="team-person">
                    <strong>{professional.display_name}</strong>
                    <span>{professional.user_id ? <><ShieldCheck size={13} /> Acesso conectado</> : "Perfil operacional"}</span>
                  </div>
                  <div className="team-contact">
                    {professional.contact_email && <span><Mail size={14} /> {professional.contact_email}</span>}
                    {professional.contact_phone && <span><Phone size={14} /> {professional.contact_phone}</span>}
                    <span>Comissão: {Number(professional.commission_percent || 0).toLocaleString("pt-BR")}%</span>
                  </div>
                  <div className="team-row-actions">
                    <em className={professional.is_active ? "" : "is-muted"}>{professional.is_active ? "Ativo" : "Inativo"}</em>
                    {canManage && <Link href={`/app/equipe?editar=${professional.id}`} aria-label={`Editar ${professional.display_name}`}><Pencil size={14} /> Editar</Link>}
                  </div>
                </article>
              ))}
            </div>
            {!professionals?.length && (
              <div className="team-empty"><UserRound size={24} /><h3>Ninguém por aqui ainda.</h3><p>Adicione o primeiro profissional para preparar a agenda da equipe.</p></div>
            )}
            {canManage && invitations?.length > 0 && (
              <div className="pending-invites">
                <div className="section-title">
                  <div><h2>Convites pendentes</h2><p>Aguardando a pessoa entrar ou criar a conta com o mesmo e-mail.</p></div>
                  <span>{invitations.length}</span>
                </div>
                {invitations.map((invitation) => (
                  <article key={invitation.id}>
                    <Clock3 size={16} />
                    <div><strong>{invitation.email}</strong><span>{roleLabels[invitation.role]}</span></div>
                    <time>até {new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(invitation.expires_at))}</time>
                    <InvitationActions invitationId={invitation.id} />
                  </article>
                ))}
              </div>
            )}
          </section>
          {canManage && (
            <aside className="team-side-forms">
              <section className="team-form-card"><InviteForm professionals={unlinkedProfessionals} /></section>
              <section className="team-form-card"><ProfessionalForm /></section>
            </aside>
          )}
        </div>
        {canManage && editableProfessional && <MobileRouteSheet className="team-form-card team-edit-sheet" open closeHref="/app/equipe" title="Editar profissional">
          <ProfessionalForm professional={editableProfessional} />
        </MobileRouteSheet>}
      </div>
  );
}

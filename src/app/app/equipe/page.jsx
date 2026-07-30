import { Mail, Phone, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import AppShell from "../../../components/app-shell";
import ProfessionalForm from "../../../components/professional-form";
import { getAppContext } from "../../../lib/app-context";

export const metadata = { title: "Equipe — Marc" };

export default async function TeamPage() {
  const { supabase, user, membership, establishment } = await getAppContext();
  const { data: professionals } = await supabase
    .from("professionals")
    .select("id, display_name, contact_email, contact_phone, color, user_id, is_active")
    .eq("establishment_id", establishment.id)
    .order("created_at");

  const canManage = ["owner", "manager"].includes(membership.role);

  return (
    <AppShell active="equipe" membership={membership} user={user}>
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
                  </div>
                  <em>{professional.is_active ? "Ativo" : "Inativo"}</em>
                </article>
              ))}
            </div>
            {!professionals?.length && (
              <div className="team-empty"><UserRound size={24} /><h3>Ninguém por aqui ainda.</h3><p>Adicione o primeiro profissional para preparar a agenda da equipe.</p></div>
            )}
          </section>
          {canManage && <aside className="team-form-card"><ProfessionalForm /></aside>}
        </div>
      </div>
    </AppShell>
  );
}

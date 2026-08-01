import { ArrowLeft, Check, Clock3, Scissors } from "lucide-react";
import Link from "next/link";
import ServiceForm from "../../../components/service-form";
import { getAppContext } from "../../../lib/app-context";

export const metadata = { title: "Serviços — Marc" };

export default async function ServicesPage() {
  const { supabase, membership, establishment, professional } = await getAppContext();

  const { data: services } = await supabase
    .from("services")
    .select("id, name, description, is_active, professional_services(price_cents, duration_minutes, is_active, professional_id)")
    .eq("establishment_id", membership.establishment_id)
    .order("created_at", { ascending: false });

  return (
    <main className="service-page">
      <header className="service-page__topbar">
        <Link href="/app"><ArrowLeft size={17} /> Voltar ao painel</Link>
        <span>{establishment.name}</span>
      </header>
      <div className="service-page__layout">
        <section className="service-list">
          <span className="section-tag">Catálogo</span>
          <h1>Serviços</h1>
          <p>O serviço reúne nome, duração e valor usados pela agenda e pela página pública.</p>
          {services?.length ? (
            <div className="service-list__items">
              {services.map((service) => {
                const ownOffering = service.professional_services?.find((offering) => offering.professional_id === professional?.id && offering.is_active);
                return (
                <article key={service.id}>
                  <div><Scissors size={18} /></div>
                  <span><strong>{service.name}</strong><small>{ownOffering ? `${ownOffering.duration_minutes} min · ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(ownOffering.price_cents / 100)}` : service.description || "Disponível no catálogo"}</small></span>
                  <em><Check size={14} /> {ownOffering ? "Na sua agenda" : "Catálogo"}</em>
                </article>
                );
              })}
            </div>
          ) : (
            <div className="service-list__empty">
              <Clock3 size={24} />
              <h2>Seu catálogo começa aqui.</h2>
              <p>Cadastre o primeiro serviço ao lado. Ele aparecerá nesta lista e no progresso do painel.</p>
            </div>
          )}
        </section>
        <aside className="service-form-card">
          {professional
            ? <ServiceForm />
            : <div className="service-professional-required"><Scissors size={23} /><span>Regras do profissional</span><h2>Serviços, valores e duração são definidos por quem atende.</h2><p>Seu acesso pode consultar o catálogo, mas precisa estar conectado a um perfil profissional para alterar essas regras.</p><Link className="button button--secondary" href="/app/equipe">Abrir equipe</Link></div>}
        </aside>
      </div>
    </main>
  );
}

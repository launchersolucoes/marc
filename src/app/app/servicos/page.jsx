import { Check, Clock3, Pencil, Scissors } from "lucide-react";
import Link from "next/link";
import ServiceForm from "../../../components/service-form";
import MobileRouteSheet from "../../../components/mobile-route-sheet";
import { getAppContext } from "../../../lib/app-context";

export const metadata = { title: "Serviços — Marc" };

export default async function ServicesPage({ searchParams }) {
  const query = await searchParams;
  const newServiceRequested = query?.novo === "1";
  const editServiceId = typeof query?.editar === "string" ? query.editar : "";
  const { supabase, user, membership, professional } = await getAppContext();

  const { data: services } = await supabase
    .from("services")
    .select("id, name, description, is_active, professional_services(price_cents, duration_minutes, is_active, professional_id)")
    .eq("establishment_id", membership.establishment_id)
    .order("created_at", { ascending: false });

  const editableService = (services || []).map((service) => {
    const offering = service.professional_services?.find((item) => item.professional_id === professional?.id);
    return offering ? {
      id: service.id,
      name: service.name,
      description: service.description,
      price_cents: offering.price_cents,
      duration_minutes: offering.duration_minutes,
      is_active: offering.is_active,
    } : null;
  }).find((service) => service?.id === editServiceId) || null;
  const serviceSheetOpen = newServiceRequested || Boolean(editableService);

  return (
      <div className="app-content service-page">
        <header className="product-heading service-page__heading">
          <div>
            <span>Oferta e agenda</span>
            <h1>Serviços</h1>
            <p>Consulte o catálogo do estabelecimento e defina o que aparece na sua própria agenda.</p>
          </div>
          {professional && <Link className="button button--primary product-heading__action" href="/app/servicos?novo=1">Novo serviço</Link>}
        </header>
        <div className="service-page__layout">
        <section className="service-list">
          <div className="section-title"><div><h2>Catálogo do estabelecimento</h2><p>Nome, duração e valor usados na agenda e na página pública.</p></div></div>
          {services?.length ? (
            <div className="service-list__items">
              {services.map((service) => {
                const ownOffering = service.professional_services?.find((offering) => offering.professional_id === professional?.id);
                return (
                <article key={service.id}>
                  <div><Scissors size={18} /></div>
                  <span><strong>{service.name}</strong><small>{ownOffering ? `${ownOffering.duration_minutes} min · ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(ownOffering.price_cents / 100)}` : service.description || "Disponível no catálogo"}</small></span>
                  <span className="service-list__actions">
                    <em className={ownOffering && !ownOffering.is_active ? "is-muted" : ""}><Check size={14} /> {ownOffering ? (ownOffering.is_active ? "Na sua agenda" : "Pausado") : "Catálogo"}</em>
                    {ownOffering && <Link href={`/app/servicos?editar=${service.id}`} aria-label={`Editar ${service.name}`}><Pencil size={14} /> Editar</Link>}
                  </span>
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
        <MobileRouteSheet className="service-form-card" open={serviceSheetOpen} closeHref="/app/servicos" title={editableService ? "Editar serviço" : "Novo serviço"}>
          {professional
            ? <ServiceForm key={editableService?.id || "new"} service={editableService} />
            : <div className="service-professional-required"><Scissors size={23} /><span>Regras do profissional</span><h2>Serviços, valores e duração são definidos por quem atende.</h2><p>Seu acesso pode consultar o catálogo, mas precisa estar conectado a um perfil profissional para alterar essas regras.</p><Link className="button button--secondary" href="/app/equipe">Abrir equipe</Link></div>}
        </MobileRouteSheet>
        </div>
      </div>
  );
}

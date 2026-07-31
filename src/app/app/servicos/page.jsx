import { ArrowLeft, Check, Clock3, Scissors } from "lucide-react";
import Link from "next/link";
import ServiceForm from "../../../components/service-form";
import { getAppContext } from "../../../lib/app-context";

export const metadata = { title: "Serviços — Marc" };

export default async function ServicesPage() {
  const { supabase, membership, establishment } = await getAppContext();

  const { data: services } = await supabase
    .from("services")
    .select("id, name, description, is_active")
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
              {services.map((service) => (
                <article key={service.id}>
                  <div><Scissors size={18} /></div>
                  <span><strong>{service.name}</strong><small>{service.description || "Pronto para receber configurações"}</small></span>
                  <em><Check size={14} /> Ativo</em>
                </article>
              ))}
            </div>
          ) : (
            <div className="service-list__empty">
              <Clock3 size={24} />
              <h2>Seu catálogo começa aqui.</h2>
              <p>Cadastre o primeiro serviço ao lado. Ele aparecerá nesta lista e no progresso do painel.</p>
            </div>
          )}
        </section>
        <aside className="service-form-card"><ServiceForm /></aside>
      </div>
    </main>
  );
}

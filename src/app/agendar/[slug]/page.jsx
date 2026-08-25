import { ArrowLeft, CalendarCheck2, MapPin, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import AppThemeToggle from "../../../components/app-theme-toggle";
import PublicBookingFlow from "../../../components/public-booking-flow";
import { createClient } from "../../../lib/supabase/server";

const categoryLabels = {
  barbershop: "Barbearia",
  salon: "Salão de beleza",
  nail_studio: "Esmalteria",
  beauty_studio: "Estúdio de beleza",
  other: "Beleza e bem-estar",
};

async function getBookingPage(slug) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_public_booking_page", {
    establishment_slug: slug,
  });
  return data;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const establishment = await getBookingPage(slug);
  return {
    title: establishment ? `Agendar em ${establishment.name} — Marc` : "Agendamento — Marc",
    description: establishment ? `Escolha serviço, profissional e horário em ${establishment.name}.` : "",
  };
}

export default async function PublicBookingPage({ params }) {
  const { slug } = await params;
  const establishment = await getBookingPage(slug);
  if (!establishment) notFound();

  const location = [establishment.address, establishment.city, establishment.state].filter(Boolean).join(" · ");

  return (
    <main className="public-booking-page">
      <div
        hidden
        aria-hidden="true"
        dangerouslySetInnerHTML={{
          __html: "<!-- THESIS: agendar deve parecer escolher um bom horário, não preencher um cadastro. OWN-WORLD: carvão/branco-gelo, laranja Marc e controles operacionais precisos. STORY: reconhecer o lugar, escolher serviço e profissional, ver apenas vagas reais, confirmar. FIRST VIEWPORT: identidade e contexto à esquerda; reserva completa e imediatamente acionável à direita. FORM: fluxo único progressivo, sem modal, dentro do sistema visual Marc. -->",
        }}
      />
      <header className="public-booking-header">
        <Link href="/" aria-label="Voltar para o site do Marc"><Image src="/assets/marc-logo-cropped.png" alt="Marc" width={208} height={90} priority /></Link>
        <AppThemeToggle />
      </header>

      <div className="public-booking-layout">
        <section className="booking-business">
          <Link href="/" className="booking-back"><ArrowLeft size={17} /> Feito com Marc</Link>
          <div className="booking-business__mark">{establishment.name.slice(0, 1).toUpperCase()}</div>
          <span>{categoryLabels[establishment.category] || categoryLabels.other}</span>
          <h1>{establishment.name}</h1>
          <p>Escolha o serviço e veja somente os horários que realmente estão livres.</p>
          <div className="booking-trust">
            {location && <div><MapPin size={17} /><span>{location}</span></div>}
            <div><ShieldCheck size={17} /><span>{establishment.booking_confirmation_mode === "manual" ? "Solicitação revisada pela equipe" : "Reserva confirmada na hora"}</span></div>
            <div><CalendarCheck2 size={17} /><span>Sem ligação ou troca de mensagens</span></div>
          </div>
        </section>

        <section className="public-booking-card" aria-label="Formulário de agendamento">
          <PublicBookingFlow establishment={establishment} />
        </section>
      </div>
    </main>
  );
}

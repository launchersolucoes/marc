import { ArrowLeft, CalendarDays, Clock3 } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Agendamento — Marc" };

export default async function PublicBookingPage({ params }) {
  const { slug } = await params;
  const readableName = slug
    .replace(/-[a-z0-9]{6}$/i, "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return (
    <main className="booking-preview">
      <header>
        <Link href="/"><ArrowLeft size={17} /> Conhecer o Marc</Link>
        <span>Página pública</span>
      </header>
      <section>
        <div className="booking-preview__icon"><CalendarDays size={26} /></div>
        <span>Agendamento online</span>
        <h1>{readableName || "Seu estabelecimento"}</h1>
        <p>A página pública já tem endereço reservado. Serviços e horários aparecerão aqui na próxima etapa.</p>
        <div className="booking-preview__slot"><Clock3 size={18} /><span>Em breve, horários disponíveis</span></div>
      </section>
    </main>
  );
}

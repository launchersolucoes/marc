import { CalendarClock, Clock3, ListTodo, Phone, Scissors, UserRound } from "lucide-react";
import AppShell from "../../../components/app-shell";
import WaitlistScheduleForm from "../../../components/waitlist-schedule-form";
import { getAppContext } from "../../../lib/app-context";

export const metadata = { title: "Lista de espera — Marc" };

export default async function WaitlistPage() {
  const { supabase, user, membership, establishment, professional } = await getAppContext();

  let request = supabase
    .from("waitlist_entries")
    .select(`
      id,
      preferred_date,
      notes,
      created_at,
      customer:customers(full_name, phone, email),
      professional_service:professional_services(
        professional_id,
        duration_minutes,
        price_cents,
        professional:professionals(display_name, color),
        service:services(name)
      )
    `)
    .eq("establishment_id", establishment.id)
    .eq("status", "waiting")
    .order("preferred_date")
    .order("created_at");

  if (membership.role === "professional" && professional) {
    request = request.eq("professional_service.professional_id", professional.id);
  }

  const { data } = await request;
  const entries = (data || []).filter((entry) =>
    membership.role !== "professional" || entry.professional_service?.professional_id === professional?.id
  );

  return (
    <AppShell active="lista-espera" membership={membership} user={user}>
      <div className="app-content waitlist-page">
        <header className="product-heading">
          <div>
            <span>Oportunidades recuperadas</span>
            <h1>Lista de espera</h1>
            <p>Clientes sem vaga aparecem aqui. Escolha um novo horário livre e transforme a solicitação em agendamento.</p>
          </div>
          <div className="heading-stat"><ListTodo size={18} /><strong>{entries.length}</strong><span>aguardando</span></div>
        </header>

        {entries.length ? (
          <section className="waitlist-board">
            <div className="section-title">
              <div><h2>Solicitações abertas</h2><p>Ordenadas pela data desejada e pela ordem de entrada.</p></div>
              <span>{entries.length}</span>
            </div>
            <div className="waitlist-list">
              {entries.map((entry) => (
                <article key={entry.id}>
                  <div className="waitlist-identity">
                    <span>{entry.customer.full_name.slice(0, 1).toUpperCase()}</span>
                    <div><strong>{entry.customer.full_name}</strong><small><Phone size={12} /> {entry.customer.phone}</small></div>
                  </div>
                  <dl>
                    <div><dt><Scissors size={13} /> Serviço</dt><dd>{entry.professional_service.service.name}</dd></div>
                    <div><dt><UserRound size={13} /> Profissional</dt><dd>{entry.professional_service.professional.display_name}</dd></div>
                    <div><dt><CalendarClock size={13} /> Data desejada</dt><dd>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${entry.preferred_date}T12:00:00Z`))}</dd></div>
                    <div><dt><Clock3 size={13} /> Entrou na lista</dt><dd>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(entry.created_at))}</dd></div>
                  </dl>
                  {entry.notes && <p className="waitlist-note">{entry.notes}</p>}
                  <WaitlistScheduleForm entry={entry} />
                </article>
              ))}
            </div>
          </section>
        ) : (
          <section className="waitlist-empty">
            <ListTodo size={28} />
            <h2>Ninguém esperando por um horário.</h2>
            <p>Quando um cliente não encontrar vaga na página pública e pedir para entrar na lista, a solicitação aparecerá aqui.</p>
          </section>
        )}
      </div>
    </AppShell>
  );
}


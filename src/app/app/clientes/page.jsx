import { CalendarDays, Search, UserPlus } from "lucide-react";
import Link from "next/link";
import CustomerForm from "../../../components/customer-form";
import MobileRouteSheet from "../../../components/mobile-route-sheet";
import { getAppContext } from "../../../lib/app-context";

export const metadata = { title: "Clientes — Marc" };

function money(cents) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export default async function CustomersPage({ searchParams }) {
  const query = await searchParams;
  const search = String(query?.busca || "").trim().replace(/[,%()]/g, "").slice(0, 80);
  const newCustomerRequested = query?.novo === "1";
  const { supabase, user, membership, establishment } = await getAppContext();
  const canManage = ["owner", "manager", "receptionist"].includes(membership.role);

  let customersQuery = supabase
    .from("customers")
    .select("id, full_name, phone, email, notes, created_at, appointments(id, starts_at, status, price_cents, professional:professionals(display_name), professional_service:professional_services(service:services(name)))")
    .eq("establishment_id", establishment.id)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (search) customersQuery = customersQuery.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
  const { data: customers } = await customersQuery;

  const rows = (customers || []).map((customer) => {
    const appointments = [...(customer.appointments || [])].sort((a, b) => new Date(b.starts_at) - new Date(a.starts_at));
    return {
      ...customer,
      appointments,
      completedCount: appointments.filter((item) => item.status === "completed").length,
      totalSpent: appointments.filter((item) => item.status === "completed").reduce((sum, item) => sum + item.price_cents, 0),
      lastAppointment: appointments[0] || null,
    };
  });

  return (
      <div className="app-content customers-page">
        <header className="product-heading">
          <div>
            <span>Relacionamento</span>
            <h1>Clientes e histórico.</h1>
            <p>Contatos, preferências e atendimentos ficam juntos para a equipe reconhecer quem volta.</p>
          </div>
          {canManage && <Link className="button button--primary product-heading__action" href="/app/clientes?novo=1">Novo cliente</Link>}
        </header>

        <div className={`customers-layout ${canManage ? "" : "customers-layout--single"}`}>
          <section className="customers-panel">
            <form className="customer-search" action="/app/clientes">
              <Search size={18} />
              <input name="busca" defaultValue={search} placeholder="Buscar por nome, telefone ou e-mail" aria-label="Buscar clientes" />
              <button className="button button--secondary" type="submit">Buscar</button>
            </form>

            {rows.length ? (
              <div className="customer-list">
                {rows.map((customer) => (
                  <article key={customer.id}>
                    <div className="customer-avatar">{customer.full_name.slice(0, 1).toUpperCase()}</div>
                    <div className="customer-identity">
                      <strong>{customer.full_name}</strong>
                      <span>{customer.phone}{customer.email ? ` · ${customer.email}` : ""}</span>
                    </div>
                    <div className="customer-history">
                      {customer.lastAppointment ? (
                        <>
                          <CalendarDays size={15} />
                          <span>
                            <strong>{customer.lastAppointment.professional_service?.service?.name || "Atendimento"}</strong>
                            {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(customer.lastAppointment.starts_at))}
                          </span>
                        </>
                      ) : <span className="customer-never">Sem atendimentos ainda</span>}
                    </div>
                    <div className="customer-value">
                      <strong>{money(customer.totalSpent)}</strong>
                      <span>{customer.completedCount} {customer.completedCount === 1 ? "concluído" : "concluídos"}</span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="team-empty">
                <UserPlus size={25} />
                <h3>{search ? "Nenhum cliente encontrado." : "Sua base começa no primeiro atendimento."}</h3>
                <p>{search ? "Tente buscar por outro nome ou telefone." : "Clientes agendados entram automaticamente. Você também pode cadastrar contatos recebidos pelo WhatsApp."}</p>
              </div>
            )}
          </section>
          {canManage && <MobileRouteSheet className="customer-form-card" open={newCustomerRequested} closeHref="/app/clientes" title="Novo cliente">
            <CustomerForm />
          </MobileRouteSheet>}
        </div>
      </div>
  );
}

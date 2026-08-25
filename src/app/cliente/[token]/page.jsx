import { ArrowLeft, Link2Off } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import AppThemeToggle from "../../../components/app-theme-toggle";
import CustomerPortal from "../../../components/customer-portal";
import { createClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Meus horários — Marc",
  description: "Consulte e gerencie seus horários pelo Marc.",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export default async function CustomerPortalPage({ params }) {
  const { token } = await params;
  const safeToken = /^[a-f0-9]{64}$/.test(token) ? token : "";
  const supabase = await createClient();
  const { data } = safeToken
    ? await supabase.rpc("get_customer_portal", { raw_token: safeToken })
    : { data: null };

  return (
    <main className="customer-portal-page">
      <div
        hidden
        aria-hidden="true"
        dangerouslySetInnerHTML={{
          __html: "<!-- THESIS: o cliente encontra o próximo compromisso antes de qualquer histórico; esta não é uma área administrativa. OWN-WORLD: carvão ou branco-gelo, um passe de horário preciso e laranja apenas nas ações. STORY: reconhecer o estabelecimento, confirmar o próximo horário, alterar somente o necessário e voltar a agendar. FIRST VIEWPORT: identidade compacta, saudação e um passe cronológico dominante com ações inline. FORM: terceiro conceito estrutural, passe de atendimento sobre trilha cronológica; seed 74c0da75. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md. -->",
        }}
      />
      <header className="customer-portal-header">
        <Link href="/" aria-label="Marc, voltar ao início">
          <Image src="/assets/marc-logo-cropped.png" alt="Marc" width={208} height={90} priority />
        </Link>
        <AppThemeToggle />
      </header>

      {data ? (
        <CustomerPortal initialData={data} token={safeToken} />
      ) : (
        <section className="customer-portal-invalid">
          <div><Link2Off size={25} /></div>
          <h1>Este acesso não está mais disponível.</h1>
          <p>O link pode ter expirado ou sido substituído por um mais recente. Peça ao estabelecimento um novo acesso aos seus horários.</p>
          <Link href="/" className="button button--secondary"><ArrowLeft size={17} /> Voltar ao Marc</Link>
        </section>
      )}
    </main>
  );
}

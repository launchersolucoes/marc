import { ArrowRight, BadgeCheck, Clock3, Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import AppThemeToggle from "../../../components/app-theme-toggle";
import { createClient } from "../../../lib/supabase/server";
import { acceptInvitation } from "./actions";

const roleLabels = {
  manager: "Gerente",
  receptionist: "Recepção",
  professional: "Profissional",
};

export const metadata = { title: "Convite para o Marc" };

export default async function InvitationPage({ params, searchParams }) {
  const { token } = await params;
  const query = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(token)) notFound();

  const supabase = await createClient();
  const [{ data: invitation }, { data: authData }] = await Promise.all([
    supabase.rpc("get_invitation", { invitation_token: token }),
    supabase.auth.getUser(),
  ]);
  if (!invitation) notFound();

  const nextPath = `/convite/${token}`;
  const available = invitation.status === "pending";

  return (
    <main className="invitation-page">
      <header>
        <Link href="/"><Image src="/assets/marc-logo-cropped.png" alt="Marc" width={208} height={90} /></Link>
        <AppThemeToggle />
      </header>
      <section className="invitation-card">
        <div className="invitation-mark"><BadgeCheck size={26} /></div>
        <span>Convite de equipe</span>
        <h1>{invitation.establishment.name}</h1>
        <p>Você foi convidado para trabalhar no Marc como <strong>{roleLabels[invitation.role]}</strong>.</p>
        <dl>
          <div><dt><Mail size={16} /> Conta esperada</dt><dd>{invitation.email}</dd></div>
          <div><dt><Clock3 size={16} /> Validade</dt><dd>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(invitation.expires_at))}</dd></div>
        </dl>
        {query?.erro && <p className="form-message form-message--error" role="alert">{query.erro}</p>}
        {!available ? (
          <div className="inline-note">Este convite expirou, foi revogado ou já foi utilizado. Peça um novo link ao estabelecimento.</div>
        ) : authData.user ? (
          <form action={acceptInvitation}>
            <input type="hidden" name="token" value={token} />
            <button className="button button--primary" type="submit">Aceitar e abrir o painel <ArrowRight size={18} /></button>
          </form>
        ) : (
          <div className="invitation-actions">
            <Link className="button button--primary" href={`/entrar?next=${encodeURIComponent(nextPath)}`}>Entrar para aceitar <ArrowRight size={18} /></Link>
            <Link className="button button--secondary" href={`/cadastro?next=${encodeURIComponent(nextPath)}`}>Criar minha conta</Link>
          </div>
        )}
      </section>
    </main>
  );
}

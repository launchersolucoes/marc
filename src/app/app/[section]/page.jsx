import { ArrowLeft, CalendarDays, CircleDollarSign, Settings, UsersRound } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

const sections = {
  agenda: {
    icon: CalendarDays,
    eyebrow: "Operação",
    title: "Agenda",
    text: "A visualização diária e semanal entra na próxima etapa, já respeitando o acesso de cada função.",
  },
  clientes: {
    icon: UsersRound,
    eyebrow: "Relacionamento",
    title: "Clientes",
    text: "Histórico, contatos e recorrência serão conectados aos atendimentos cadastrados.",
  },
  equipe: {
    icon: UsersRound,
    eyebrow: "Pessoas e acessos",
    title: "Equipe",
    text: "Aqui você convidará gerência, recepção e profissionais com as permissões definidas para cada papel.",
  },
  financeiro: {
    icon: CircleDollarSign,
    eyebrow: "Gestão",
    title: "Financeiro",
    text: "Caixa, faturamento e comissões serão alimentados pelos atendimentos concluídos.",
  },
  configuracoes: {
    icon: Settings,
    eyebrow: "Preferências",
    title: "Configurações",
    text: "Dados do estabelecimento, segurança e preferências da operação ficarão centralizados aqui.",
  },
};

export default async function SectionPage({ params }) {
  const { section } = await params;
  const content = sections[section];
  if (!content) notFound();

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/entrar");

  const Icon = content.icon;
  return (
    <main className="pending-page">
      <Link href="/app"><ArrowLeft size={17} /> Voltar ao painel</Link>
      <section>
        <div><Icon size={24} /></div>
        <span>{content.eyebrow}</span>
        <h1>{content.title}</h1>
        <p>{content.text}</p>
        <small>Base preparada · implementação em sequência</small>
      </section>
    </main>
  );
}

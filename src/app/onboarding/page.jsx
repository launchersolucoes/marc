import Image from "next/image";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import AppThemeToggle from "../../components/app-theme-toggle";
import OnboardingForm from "../../components/onboarding-form";
import { signOut } from "../auth/actions";
import { createClient } from "../../lib/supabase/server";

export const metadata = { title: "Configure seu negócio — Marc" };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/entrar");

  const { data: membership } = await supabase
    .from("establishment_memberships")
    .select("id")
    .eq("user_id", data.user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (membership) redirect("/app");

  const defaultName = String(data.user.user_metadata?.full_name || "").split(" ")[0];

  return (
    <main className="onboarding-page">
      <header className="onboarding-header">
        <Image src="/assets/marc-logo-cropped.png" alt="Marc" width={208} height={90} priority />
        <div className="onboarding-header__actions">
          <span>Configuração inicial</span>
          <form action={signOut}>
            <button className="onboarding-signout" type="submit" aria-label="Sair desta conta e entrar com outra">
              <LogOut size={16} />
              <span className="onboarding-signout__wide">Trocar conta</span>
              <span className="onboarding-signout__short">Sair</span>
            </button>
          </form>
          <AppThemeToggle />
        </div>
      </header>
      <section className="onboarding-layout">
        <aside className="onboarding-aside">
          <span>Seu ponto de partida</span>
          <h2>Uma agenda pronta para crescer com você.</h2>
          <p>
            Agora criamos a estrutura do negócio. Serviços, horários e equipe entram logo
            depois, já dentro do painel.
          </p>
          <div className="onboarding-preview" aria-hidden="true">
            <div><span>Hoje</span><strong>Agenda organizada</strong></div>
            <div className="onboarding-preview__line is-wide" />
            <div className="onboarding-preview__line" />
            <div className="onboarding-preview__line is-short" />
          </div>
        </aside>
        <div className="onboarding-card">
          <OnboardingForm defaultName={defaultName} />
        </div>
      </section>
    </main>
  );
}

import { CalendarCheck2, Check, Clock3, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import AppThemeToggle from "./app-theme-toggle";

export default function AuthShell({ children, mode }) {
  const isSignup = mode === "signup";

  return (
    <main className="auth-page">
      <section className="auth-story" aria-label="Benefícios do Marc">
        <Link className="auth-brand" href="/" aria-label="Voltar para o início">
          <Image
            src="/assets/marc-logo-cropped.png"
            alt="Marc"
            width={208}
            height={90}
            priority
          />
        </Link>

        <div className="auth-story__content">
          <span className="auth-kicker">
            <Clock3 size={16} /> Configuração rápida
          </span>
          <h1>
            Seu primeiro horário organizado começa <em>agora.</em>
          </h1>
          <p>
            Crie o acesso, configure seu estabelecimento e deixe a agenda pronta para
            receber clientes.
          </p>
          <ul>
            <li><Check size={17} /> Agenda de toda a operação em um lugar</li>
            <li><Check size={17} /> Acesso certo para cada pessoa da equipe</li>
            <li><Check size={17} /> Sem cartão durante o teste</li>
          </ul>
        </div>

        <div className="auth-story__proof">
          <CalendarCheck2 size={21} />
          <div>
            <strong>Menos de 3 minutos</strong>
            <span>para deixar a base do negócio pronta</span>
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-panel__top">
          <Link className="auth-panel__back" href="/">Voltar ao site</Link>
          <AppThemeToggle />
        </div>
        <div className="auth-card">
          <div className="auth-card__icon"><ShieldCheck size={22} /></div>
          <h2>{isSignup ? "Comece seu teste" : "Bem-vindo de volta"}</h2>
          <p>
            {isSignup
              ? "Primeiro criamos seu acesso. Depois você configura o estabelecimento."
              : "Entre para acompanhar sua agenda e sua operação."}
          </p>
          {children}
        </div>
      </section>
    </main>
  );
}

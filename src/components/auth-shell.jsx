import { CalendarCheck2, Check, Clock3, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import AppThemeToggle from "./app-theme-toggle";

export default function AuthShell({ children, mode }) {
  const content = {
    signup: {
      panel: ["Comece seu teste", "Primeiro criamos seu acesso. Depois você configura o estabelecimento."],
      label: "Teste guiado de 14 dias",
      title: <>Sua operação organizada começa <em>agora.</em></>,
      description: "Crie o acesso, configure o estabelecimento e prepare a agenda para receber clientes.",
      proof: ["14 dias para testar", "sem cartão de crédito para começar"],
    },
    signin: {
      panel: ["Bem-vindo de volta", "Entre para acompanhar sua agenda e sua operação."],
      label: "Sua operação continua daqui",
      title: <>Agenda, equipe e caixa no <em>mesmo ritmo.</em></>,
      description: "Entre para acompanhar o dia, atualizar atendimentos e manter a equipe alinhada.",
      proof: ["Tudo no lugar", "seu contexto aparece assim que você entra"],
    },
    recovery: {
      panel: ["Recupere seu acesso", "Enviaremos um link seguro para o e-mail vinculado à sua conta."],
      label: "Recuperação segura",
      title: <>Volte para sua operação sem perder o <em>contexto.</em></>,
      description: "Use o e-mail da conta para receber um link seguro e retomar o acesso ao Marc.",
      proof: ["Seus dados continuam seguros", "a recuperação não altera agenda ou histórico"],
    },
    "update-password": {
      panel: ["Crie uma nova senha", "Escolha uma senha segura que você ainda não utiliza em outros serviços."],
      label: "Proteja seu acesso",
      title: <>Uma nova senha. A mesma operação <em>preservada.</em></>,
      description: "Defina uma senha exclusiva para voltar ao Marc com segurança.",
      proof: ["Acesso protegido", "agenda, clientes e histórico permanecem intactos"],
    },
  }[mode] || {
    panel: ["Acesse o Marc", "Continue para sua operação."],
    label: "Acesso seguro",
    title: <>Sua operação no <em>Marc.</em></>,
    description: "Entre para continuar de onde parou.",
    proof: ["Contexto preservado", "seus dados continuam no lugar"],
  };

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
            <Clock3 size={16} /> {content.label}
          </span>
          <h1>{content.title}</h1>
          <p>{content.description}</p>
          <ul>
            <li><Check size={17} /> Agenda de toda a operação em um lugar</li>
            <li><Check size={17} /> Acesso certo para cada pessoa da equipe</li>
            <li><Check size={17} /> Sem cartão durante o teste</li>
          </ul>
        </div>

        <div className="auth-story__proof">
          <CalendarCheck2 size={21} />
          <div>
            <strong>{content.proof[0]}</strong>
            <span>{content.proof[1]}</span>
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
          <h2>{content.panel[0]}</h2>
          <p>{content.panel[1]}</p>
          {children}
        </div>
      </section>
    </main>
  );
}

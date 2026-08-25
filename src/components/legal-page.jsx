import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import AppThemeToggle from "./app-theme-toggle";

export default function LegalPage({ title, summary, updatedAt, children }) {
  return (
    <main className="legal-page">
      <header className="legal-header">
        <Link className="legal-brand" href="/" aria-label="Marc, voltar ao início">
          <Image src="/assets/marc-logo-cropped.png" alt="Marc" width={208} height={90} priority />
        </Link>
        <nav aria-label="Documentos legais">
          <Link href="/privacidade">Privacidade</Link>
          <Link href="/termos">Termos</Link>
          <AppThemeToggle />
        </nav>
      </header>

      <div className="legal-layout">
        <aside className="legal-context">
          <Link href="/" className="legal-back"><ArrowLeft size={16} /> Voltar ao Marc</Link>
          <div className="legal-context__mark"><ShieldCheck size={22} /></div>
          <h1>{title}</h1>
          <p>{summary}</p>
          <dl>
            <div><dt>Última atualização</dt><dd>{updatedAt}</dd></div>
            <div><dt>Responsável pela operação</dt><dd>58.199.674 Alan de Souza Pires</dd></div>
            <div><dt>CNPJ</dt><dd>58.199.674/0001-47</dd></div>
            <div><dt>Endereço de contato</dt><dd>Rua João Marques Ferreira, 312 — Praça Cruzeiro, Rio Bonito — RJ</dd></div>
            <div><dt>Canal de contato</dt><dd><a href="mailto:launchersolucoes@gmail.com"><Mail size={14} /> launchersolucoes@gmail.com</a></dd></div>
          </dl>
        </aside>

        <article className="legal-document">{children}</article>
      </div>
    </main>
  );
}

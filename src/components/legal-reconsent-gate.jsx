import { ArrowUpRight, FileCheck2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { currentLegalDocuments } from "../lib/legal-documents";
import LegalReconsentForm from "./legal-reconsent-form";

export default function LegalReconsentGate() {
  return (
    <div className="app-content legal-reconsent">
      <section className="legal-reconsent__intro">
        <div className="legal-reconsent__mark"><ShieldCheck size={24} /></div>
        <h1>Antes de continuar, revise o que mudou.</h1>
        <p>
          Atualizamos os documentos que orientam o uso do Marc e o tratamento dos dados.
          Sua operação permanece intacta; basta confirmar as versões vigentes para voltar ao painel.
        </p>
        <div className="legal-reconsent__assurance">
          <FileCheck2 size={18} />
          <span><strong>Nenhum dado foi alterado</strong><small>Agenda, clientes e financeiro continuam como estavam.</small></span>
        </div>
      </section>

      <section className="legal-reconsent__action" aria-labelledby="legal-reconsent-title">
        <header>
          <h2 id="legal-reconsent-title">Documentos vigentes</h2>
          <p>Abra os documentos para ler o conteúdo completo antes de confirmar.</p>
        </header>
        <div className="legal-reconsent__documents">
          {Object.entries(currentLegalDocuments).map(([type, document]) => (
            <Link key={type} href={document.href} target="_blank" rel="noreferrer">
              <span><strong>{document.title}</strong><small>Versão {document.version}</small></span>
              <ArrowUpRight size={17} />
            </Link>
          ))}
        </div>
        <LegalReconsentForm documents={currentLegalDocuments} />
      </section>
    </div>
  );
}

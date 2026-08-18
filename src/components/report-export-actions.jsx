"use client";

import { FileDown, FileSpreadsheet } from "lucide-react";

export default function ReportExportActions({ month }) {
  return (
    <div className="report-export-actions" aria-label="Exportar relatório">
      <a className="button button--secondary" href={`/api/reports/export?month=${month}`}>
        <FileSpreadsheet size={16} /> Exportar planilha
      </a>
      <button className="button button--secondary" type="button" onClick={() => window.print()}>
        <FileDown size={16} /> Salvar em PDF
      </button>
    </div>
  );
}

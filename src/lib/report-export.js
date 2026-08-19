const reportStatusLabels = {
  pending: "Pendente",
  confirmed: "Confirmado",
  in_progress: "Em atendimento",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Falta",
};

const reportSourceLabels = {
  dashboard: "Painel",
  public_booking: "Agendamento online",
  waitlist: "Lista de espera",
};

export function currentReportMonth(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(now);
}

export function normalizeReportMonth(value, fallback = currentReportMonth()) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value || "") ? value : fallback;
}

export function reportMonthBounds(month) {
  const startDate = new Date(`${month}-01T12:00:00Z`);
  const nextDate = new Date(startDate);
  nextDate.setUTCMonth(nextDate.getUTCMonth() + 1);
  return {
    start: `${month}-01T00:00:00-03:00`,
    end: `${nextDate.toISOString().slice(0, 7)}-01T00:00:00-03:00`,
  };
}

function safeSpreadsheetValue(value) {
  const text = String(value ?? "").replace(/\r?\n/g, " ").trim();
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function csvCell(value) {
  return `"${safeSpreadsheetValue(value).replaceAll('"', '""')}"`;
}

function dateParts(value) {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Sao_Paulo",
  }).formatToParts(new Date(value));
  const part = (type) => parts.find((item) => item.type === type)?.value || "";
  return { date: `${part("day")}/${part("month")}/${part("year")}`, time: `${part("hour")}:${part("minute")}` };
}

export function buildAppointmentsCsv(appointments = []) {
  const rows = [[
    "Data", "Hora", "Cliente", "Telefone", "E-mail", "Profissional", "Serviço", "Status", "Origem", "Valor (R$)",
  ]];

  appointments.forEach((appointment) => {
    const { date, time } = dateParts(appointment.starts_at);
    rows.push([
      date,
      time,
      appointment.customer?.full_name || "Cliente não identificado",
      appointment.customer?.phone || "",
      appointment.customer?.email || "",
      appointment.professional?.display_name || "Sem profissional",
      appointment.professional_service?.service?.name || "Serviço não identificado",
      reportStatusLabels[appointment.status] || appointment.status,
      reportSourceLabels[appointment.source] || appointment.source,
      (Number(appointment.price_cents || 0) / 100).toFixed(2).replace(".", ","),
    ]);
  });

  return `\uFEFF${rows.map((row) => row.map(csvCell).join(";")).join("\r\n")}`;
}

const closingMethods = [
  ["cash", "Dinheiro"],
  ["pix", "Pix"],
  ["credit_card", "Crédito"],
  ["debit_card", "Débito"],
  ["other", "Outros"],
];

function csvMoney(value) {
  return (Number(value || 0) / 100).toFixed(2).replace(".", ",");
}

export function buildReportCsv(appointments = [], closings = []) {
  const appointmentCsv = buildAppointmentsCsv(appointments).slice(1);
  if (!closings.length) return `\uFEFF${appointmentCsv}`;

  const rows = [
    [],
    ["Fechamentos do caixa"],
    [
      "Data",
      "Status",
      ...closingMethods.flatMap(([, label]) => [`Sistema - ${label} (R$)`, `Conferido - ${label} (R$)`, `Diferença - ${label} (R$)`]),
      "Saídas (R$)",
      "Diferença absoluta (R$)",
      "Observação",
    ],
  ];

  closings.forEach((closing) => {
    const differenceTotal = closingMethods.reduce(
      (sum, [key]) => sum + Math.abs(Number(closing.difference_totals?.[key] || 0)),
      0,
    );
    rows.push([
      new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${closing.business_date}T12:00:00Z`)),
      closing.status === "closed" ? "Fechado" : "Reaberto",
      ...closingMethods.flatMap(([key]) => [
        csvMoney(closing.expected_totals?.[key]),
        csvMoney(closing.declared_totals?.[key]),
        csvMoney(closing.difference_totals?.[key]),
      ]),
      csvMoney(closing.expense_total_cents),
      csvMoney(differenceTotal),
      closing.notes || "",
    ]);
  });

  return `\uFEFF${appointmentCsv}\r\n${rows.map((row) => row.map(csvCell).join(";")).join("\r\n")}`;
}

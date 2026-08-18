import { getAppContext } from "../../../../lib/app-context";
import { buildAppointmentsCsv, normalizeReportMonth, reportMonthBounds } from "../../../../lib/report-export";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  const { supabase, membership, establishment } = await getAppContext();
  if (!["owner", "manager"].includes(membership.role)) {
    return Response.json({ error: "Acesso restrito à gestão." }, { status: 403 });
  }

  const month = normalizeReportMonth(new URL(request.url).searchParams.get("month"));
  const bounds = reportMonthBounds(month);
  const { data, error } = await supabase
    .from("appointments")
    .select(`
      starts_at,
      status,
      source,
      price_cents,
      customer:customers(full_name, phone, email),
      professional:professionals(display_name),
      professional_service:professional_services(service:services(name))
    `)
    .eq("establishment_id", establishment.id)
    .gte("starts_at", bounds.start)
    .lt("starts_at", bounds.end)
    .order("starts_at");

  if (error) return Response.json({ error: "Não foi possível preparar a exportação." }, { status: 500 });

  return new Response(buildAppointmentsCsv(data || []), {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="marc-relatorio-${month}.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

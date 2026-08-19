import { getAppContext } from "../../../../lib/app-context";
import { buildReportCsv, normalizeReportMonth, reportMonthBounds } from "../../../../lib/report-export";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  const { supabase, membership, establishment } = await getAppContext();
  if (!["owner", "manager"].includes(membership.role)) {
    return Response.json({ error: "Acesso restrito à gestão." }, { status: 403 });
  }

  const month = normalizeReportMonth(new URL(request.url).searchParams.get("month"));
  const bounds = reportMonthBounds(month);
  const [appointmentsResult, closingsResult] = await Promise.all([
    supabase
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
      .order("starts_at"),
    supabase
      .from("financial_day_closings")
      .select("business_date, status, expected_totals, declared_totals, difference_totals, expense_total_cents, notes")
      .eq("establishment_id", establishment.id)
      .gte("business_date", bounds.start.slice(0, 10))
      .lt("business_date", bounds.end.slice(0, 10))
      .order("business_date"),
  ]);

  if (appointmentsResult.error || closingsResult.error) {
    return Response.json({ error: "Não foi possível preparar a exportação." }, { status: 500 });
  }

  return new Response(buildReportCsv(appointmentsResult.data || [], closingsResult.data || []), {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="marc-relatorio-${month}.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

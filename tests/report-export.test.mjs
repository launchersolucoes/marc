import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildAppointmentsCsv, normalizeReportMonth, reportMonthBounds } from "../src/lib/report-export.js";

test("normalizes report months and creates Sao Paulo month bounds", () => {
  assert.equal(normalizeReportMonth("2026-08", "2026-01"), "2026-08");
  assert.equal(normalizeReportMonth("2026-13", "2026-01"), "2026-01");
  assert.deepEqual(reportMonthBounds("2026-12"), {
    start: "2026-12-01T00:00:00-03:00",
    end: "2027-01-01T00:00:00-03:00",
  });
});

test("exports Excel-compatible CSV without allowing spreadsheet formulas", () => {
  const csv = buildAppointmentsCsv([{
    starts_at: "2026-08-18T15:30:00Z",
    status: "completed",
    source: "public_booking",
    price_cents: 4990,
    customer: { full_name: "=SOMA(1;1)", phone: "21999999999", email: "cliente@example.com" },
    professional: { display_name: "Profissional Piloto" },
    professional_service: { service: { name: "Corte" } },
  }]);

  assert.ok(csv.startsWith("\uFEFF"));
  assert.match(csv, /"'\=SOMA\(1;1\)"/);
  assert.match(csv, /"Concluído"/);
  assert.match(csv, /"Agendamento online"/);
  assert.match(csv, /"49,90"/);
});

test("export route remains role and establishment scoped", async () => {
  const route = await readFile(new URL("../src/app/api/reports/export/route.js", import.meta.url), "utf8");
  assert.match(route, /\["owner", "manager"\]\.includes\(membership\.role\)/);
  assert.match(route, /\.eq\("establishment_id", establishment\.id\)/);
  assert.match(route, /Cache-Control": "private, no-store"/);
  assert.doesNotMatch(route, /createAdminClient|SUPABASE_SERVICE_ROLE_KEY/);
});

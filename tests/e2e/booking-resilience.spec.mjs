import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import {
  cleanupPilotCustomers,
  getPilotOwnerContext,
  nextOpenDate,
  nextSundayDate,
  pilotEmail,
  pilotPassword,
  pilotSlug,
} from "./pilot-fixture.mjs";

const phones = {
  raceA: "11999990031",
  raceB: "11999990032",
  duplicate: "11999990033",
  staleWinner: "11999990034",
  staleLoser: "11999990035",
  abuse: "11999990036",
};

const configured = Boolean(
  pilotEmail
  && pilotPassword
  && pilotSlug
  && process.env.NEXT_PUBLIC_SUPABASE_URL
  && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

function anonymousClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

async function publicFixture(date) {
  const supabase = anonymousClient();
  const { data: establishment, error: pageError } = await supabase.rpc("get_public_booking_page", {
    establishment_slug: pilotSlug,
  });
  if (pageError) throw pageError;
  const offering = establishment.offerings[0];
  const { data: slots, error: slotsError } = await supabase.rpc("get_public_available_slots", {
    establishment_slug: pilotSlug,
    target_professional_service_id: offering.id,
    booking_date: date,
  });
  if (slotsError) throw slotsError;
  if (!slots?.length) throw new Error(`O piloto não possui horários livres em ${date}.`);
  return { offering, slot: slots[0].slot_start };
}

async function publicFixtures(count) {
  const supabase = anonymousClient();
  const { data: establishment, error: pageError } = await supabase.rpc("get_public_booking_page", {
    establishment_slug: pilotSlug,
  });
  if (pageError) throw pageError;
  const offering = establishment.offerings[0];
  const fixtures = [];

  for (let daysAhead = 14; daysAhead <= 45 && fixtures.length < count; daysAhead += 1) {
    const date = nextOpenDate(daysAhead);
    if (fixtures.some((fixture) => fixture.date === date)) continue;
    const { data: slots, error } = await supabase.rpc("get_public_available_slots", {
      establishment_slug: pilotSlug,
      target_professional_service_id: offering.id,
      booking_date: date,
    });
    if (error) throw error;
    if (slots?.length) fixtures.push({ date, slot: slots[0].slot_start });
  }

  if (fixtures.length < count) throw new Error(`O piloto não possui ${count} dias com horários livres.`);
  return { offering, fixtures };
}

async function createPublicAppointment({ offeringId, slot, phone, name }) {
  return anonymousClient().rpc("create_public_appointment", {
    establishment_slug: pilotSlug,
    target_professional_service_id: offeringId,
    customer_name: name,
    customer_phone: phone,
    customer_email: "",
    local_start: slot,
  });
}

test.describe("resiliência do agendamento público", () => {
  test.skip(!configured, "A conta e o Supabase do piloto precisam estar configurados.");

  test.beforeEach(async () => cleanupPilotCustomers(Object.values(phones)));
  test.afterEach(async () => cleanupPilotCustomers(Object.values(phones)));

  test("duas reservas simultâneas nunca ocupam o mesmo horário", async () => {
    const { offering, slot } = await publicFixture(nextOpenDate(7));
    const results = await Promise.all([
      createPublicAppointment({ offeringId: offering.id, slot, phone: phones.raceA, name: "Cliente Corrida A" }),
      createPublicAppointment({ offeringId: offering.id, slot, phone: phones.raceB, name: "Cliente Corrida B" }),
    ]);

    expect(results.filter(({ data, error }) => data && !error)).toHaveLength(1);
    const failures = results.filter(({ error }) => error);
    expect(failures).toHaveLength(1);
    expect(failures[0].error.message).toMatch(/conflict/i);
  });

  test("repetir a mesma solicitação mantém uma única entrada na lista", async () => {
    const supabase = anonymousClient();
    const { data: establishment, error: pageError } = await supabase.rpc("get_public_booking_page", {
      establishment_slug: pilotSlug,
    });
    if (pageError) throw pageError;
    const payload = {
      establishment_slug: pilotSlug,
      target_professional_service_id: establishment.offerings[0].id,
      customer_name: "Cliente Duplicado E2E",
      customer_phone: phones.duplicate,
      customer_email: "",
      target_preferred_date: nextSundayDate(),
      waitlist_notes: "",
    };

    const first = await supabase.rpc("create_public_waitlist_entry", payload);
    const second = await supabase.rpc("create_public_waitlist_entry", payload);
    expect(first.error).toBeNull();
    expect(second.error).toBeNull();
    expect(second.data).toBe(first.data);
  });

  test("limita abuso de reservas e registra auditoria sem dados pessoais", async () => {
    const { offering, fixtures } = await publicFixtures(6);
    const successfulIds = [];

    for (const fixture of fixtures.slice(0, 5)) {
      const result = await createPublicAppointment({
        offeringId: offering.id,
        slot: fixture.slot,
        phone: phones.abuse,
        name: "Cliente Limite E2E",
      });
      expect(result.error).toBeNull();
      successfulIds.push(result.data);
    }

    const blocked = await createPublicAppointment({
      offeringId: offering.id,
      slot: fixtures[5].slot,
      phone: phones.abuse,
      name: "Cliente Limite E2E",
    });
    expect(blocked.data).toBeNull();
    expect(blocked.error?.message).toMatch(/limit/i);

    const { supabase, establishmentId } = await getPilotOwnerContext();
    const { data: events, error: auditError } = await supabase
      .from("operational_audit_events")
      .select("event_name, entity_id, metadata")
      .eq("establishment_id", establishmentId)
      .eq("event_name", "appointment.created")
      .in("entity_id", successfulIds);
    expect(auditError).toBeNull();
    expect(events).toHaveLength(5);
    expect(JSON.stringify(events)).not.toMatch(/Cliente Limite|11999990036|customer_(name|phone|email)/i);
  });

  test("horário tomado durante o preenchimento é removido e explicado", async ({ page }) => {
    const date = nextOpenDate(8);
    await page.goto(`/agendar/${pilotSlug}`);
    await page.waitForLoadState("networkidle");
    await page.getByLabel("Data").fill(date);
    const slot = page.getByRole("radio").first();
    await expect(slot).toBeVisible();
    await slot.check();
    const selectedSlot = await slot.inputValue();
    const offeringId = await page.getByLabel("Profissional").inputValue();
    await page.getByLabel("Seu nome").fill("Cliente Atrasado E2E");
    await page.getByLabel("WhatsApp").fill(phones.staleLoser);

    const winner = await createPublicAppointment({
      offeringId,
      slot: selectedSlot,
      phone: phones.staleWinner,
      name: "Cliente Vencedor E2E",
    });
    expect(winner.error).toBeNull();

    await page.getByRole("button", { name: "Confirmar meu horário" }).click();
    await expect(page.getByText("Esse horário acabou de ser reservado. Escolha outro disponível.", { exact: true })).toBeVisible();
    await expect(page.locator(`input[type="radio"][value="${selectedSlot}"]`)).toHaveCount(0);
  });

  test("falha temporária na consulta permite tentar outra data", async ({ page }) => {
    const slotsEndpoint = "**/rest/v1/rpc/get_public_available_slots";
    await page.route(slotsEndpoint, (route) => route.abort());
    await page.goto(`/agendar/${pilotSlug}`);
    await expect(page.getByText("Não foi possível consultar os horários. Tente novamente.", { exact: true })).toBeVisible();

    await page.unroute(slotsEndpoint);
    await page.getByLabel("Data").fill(nextOpenDate(2));
    await expect(page.getByRole("radio").first()).toBeVisible();
    await expect(page.getByText("Não foi possível consultar os horários. Tente novamente.", { exact: true })).toHaveCount(0);
  });
});

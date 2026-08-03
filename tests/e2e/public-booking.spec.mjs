import { expect, test } from "@playwright/test";
import {
  cleanupPilotCustomer,
  nextOpenDate,
  pilotEmail,
  pilotPassword,
  pilotSlug,
} from "./pilot-fixture.mjs";

const customerPhone = "11999990001";

test.describe("agendamento público do piloto", () => {
  test.skip(!pilotEmail || !pilotPassword || !pilotSlug, "A conta piloto precisa estar provisionada.");

  test.beforeEach(async () => cleanupPilotCustomer(customerPhone));
  test.afterEach(async () => cleanupPilotCustomer(customerPhone));

  test("cliente escolhe um horário real e recebe confirmação", async ({ page }) => {
    await page.goto(`/agendar/${pilotSlug}`);

    await expect(page.getByRole("heading", { level: 1, name: "Estúdio Piloto Marc" })).toBeVisible();
    await page.getByLabel("Data").fill(nextOpenDate());

    const slots = page.getByRole("radio");
    await expect(slots.first()).toBeVisible();
    await slots.first().check();
    await page.getByLabel("Seu nome").fill("Cliente Piloto E2E");
    await page.getByLabel("WhatsApp").fill(customerPhone);
    await page.getByRole("button", { name: "Confirmar meu horário" }).click();

    await expect(page.getByRole("status")).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Pronto, Cliente." })).toBeVisible();
    await expect(page.getByText("Atendimento piloto", { exact: true })).toBeVisible();
  });
});

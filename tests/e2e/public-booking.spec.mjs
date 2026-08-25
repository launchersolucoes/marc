import { expect, test } from "@playwright/test";
import {
  cleanupPilotCustomer,
  cleanupPilotCustomers,
  nextOpenDate,
  nextSundayDate,
  pilotEmail,
  pilotPassword,
  pilotSlug,
} from "./pilot-fixture.mjs";

const customerPhone = "11999990001";
const waitlistPhone = "11999990024";
const removedWaitlistPhone = "11999990025";

async function signInReception(page) {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(process.env.E2E_RECEPTIONIST_EMAIL);
  await page.locator('input[name="password"]').fill(process.env.E2E_RECEPTIONIST_PASSWORD);
  await page.getByRole("button", { name: "Entrar no Marc" }).click();
  await page.waitForURL(/\/app(?:\/|$)/);
}

async function joinWaitlist(page, { name, phone }) {
  await page.goto(`/agendar/${pilotSlug}`);
  await page.waitForLoadState("networkidle");
  const date = page.getByLabel("Data");
  await date.fill(nextSundayDate());
  await expect(date).toHaveValue(nextSundayDate());
  await expect(page.getByText("Nenhum horário livre nesta data.", { exact: true })).toBeVisible();
  await expect(page.getByText("Escolha outro dia ou deixe seu contato na lista de espera.", { exact: true })).toBeVisible();
  await page.getByLabel("Seu nome").fill(name);
  await page.getByLabel("WhatsApp").fill(phone);
  await page.getByRole("button", { name: "Entrar na lista de espera" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Pedido registrado, Cliente." })).toBeVisible();
}

test.describe("agendamento público do piloto", () => {
  test.skip(!pilotEmail || !pilotPassword || !pilotSlug, "A conta piloto precisa estar provisionada.");

  test.beforeEach(async () => cleanupPilotCustomers([customerPhone, waitlistPhone, removedWaitlistPhone]));
  test.afterEach(async () => cleanupPilotCustomers([customerPhone, waitlistPhone, removedWaitlistPhone]));

  test("cliente escolhe um horário real, abre o portal e cancela @responsive", async ({ page }) => {
    await page.goto(`/agendar/${pilotSlug}`);

    await expect(page.getByRole("heading", { level: 1, name: "Estúdio Piloto Marc" })).toBeVisible();
    const selectedService = await page.getByLabel("Serviço").locator("option:checked").textContent();
    await page.getByLabel("Data").fill(nextOpenDate());

    const slots = page.getByRole("radio");
    await expect(slots.first()).toBeVisible();
    await slots.first().check();
    await page.getByLabel("Seu nome").fill("Cliente Piloto E2E");
    await page.getByLabel("WhatsApp").fill(customerPhone);
    await page.getByRole("button", { name: "Confirmar meu horário" }).click();

    await expect(page.getByRole("status")).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Pronto, Cliente." })).toBeVisible();
    await expect(page.getByRole("definition").filter({ hasText: selectedService.trim() })).toBeVisible();

    const portalLink = page.getByRole("link", { name: "Ver e gerenciar meus horários" });
    await expect(portalLink).toHaveAttribute("href", /^\/cliente\/[a-f0-9]{64}$/);
    await portalLink.click();

    await expect(page).toHaveURL(/\/cliente\/[a-f0-9]{64}$/);
    await expect(page.getByRole("heading", { level: 1, name: "Olá, Cliente." })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: selectedService.trim() })).toBeVisible();

    await page.getByRole("button", { name: "Cancelar horário" }).click();
    await expect(page.getByText("Cancelar este horário?", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Confirmar cancelamento" }).click();

    await expect(page.getByRole("status")).toContainText("Horário cancelado");
    await expect(page.getByRole("heading", { level: 2, name: "Nenhum horário marcado." })).toBeVisible();
    await expect(page.getByText("Cancelado", { exact: true })).toBeVisible();
  });

  test("cliente entra na lista e recepção converte a solicitação em horário", async ({ page }) => {
    test.skip(!process.env.E2E_RECEPTIONIST_EMAIL || !process.env.E2E_RECEPTIONIST_PASSWORD, "A matriz de papéis precisa estar provisionada.");
    const customer = "Cliente Espera E2E";
    const scheduledDate = nextOpenDate(5);
    await joinWaitlist(page, { name: customer, phone: waitlistPhone });

    await signInReception(page);
    await page.goto("/app/lista-espera");
    const entry = page.locator(".waitlist-list article").filter({ hasText: customer });
    await expect(entry).toBeVisible();
    await entry.getByLabel("Novo horário").fill(`${scheduledDate}T16:30`);
    await entry.getByRole("button", { name: "Confirmar horário" }).click();
    await expect(entry).toHaveCount(0);

    await page.goto(`/app/agenda?date=${scheduledDate}`);
    await expect(page.getByRole("link", { name: new RegExp(customer) })).toBeVisible();
  });

  test("recepção remove uma solicitação que não seguirá para a agenda", async ({ page }) => {
    test.skip(!process.env.E2E_RECEPTIONIST_EMAIL || !process.env.E2E_RECEPTIONIST_PASSWORD, "A matriz de papéis precisa estar provisionada.");
    const customer = "Cliente Remoção E2E";
    await joinWaitlist(page, { name: customer, phone: removedWaitlistPhone });

    await signInReception(page);
    await page.goto("/app/lista-espera");
    const entry = page.locator(".waitlist-list article").filter({ hasText: customer });
    await expect(entry).toBeVisible();
    await entry.getByRole("button", { name: "Remover" }).click();
    await expect(entry).toHaveCount(0);
  });
});

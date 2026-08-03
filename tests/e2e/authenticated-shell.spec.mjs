import { expect, test } from "@playwright/test";
import { cleanupPilotCustomer, nextOpenDate, pilotEmail, pilotPassword } from "./pilot-fixture.mjs";

const email = pilotEmail;
const password = pilotPassword;

test.describe("operação autenticada", () => {
  test.skip(!email || !password, "Defina E2E_EMAIL e E2E_PASSWORD para uma conta exclusiva de piloto.");

  test.beforeEach(async ({ page }) => {
    await page.goto("/entrar");
    await page.getByLabel("E-mail").fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.getByRole("button", { name: "Entrar no Marc" }).click();
    await page.waitForURL(/\/(app|onboarding|master)(\/|$)/);
  });

  test("conta de piloto alcança a área operacional", async ({ page }) => {
    test.skip(new URL(page.url()).pathname === "/onboarding", "A conta E2E ainda precisa concluir o onboarding.");
    test.skip(new URL(page.url()).pathname === "/master", "Use uma conta de estabelecimento, não uma conta Master.");

    const navigation = page.getByRole("navigation", { name: "Navegação do painel" });
    await expect(navigation).toBeVisible();
    await expect(navigation.getByRole("link", { name: "Agenda", exact: true })).toBeVisible();
    await expect(navigation.getByRole("link", { name: "Clientes", exact: true })).toBeVisible();
    await expect(navigation.getByRole("link", { name: "Serviços", exact: true })).toBeVisible();
    await expect(navigation.getByRole("link", { name: "Equipe", exact: true })).toBeVisible();
  });

  test("áreas essenciais carregam com o papel de dono", async ({ page }) => {
    const routes = [
      ["/app/agenda", "Agenda"],
      ["/app/clientes", "Clientes e histórico."],
      ["/app/servicos", "Serviços"],
      ["/app/equipe", "Quem faz a agenda acontecer."],
      ["/app/lista-espera", "Lista de espera"],
      ["/app/financeiro", "Financeiro"],
      ["/app/comissoes", "Comissões"],
      ["/app/relatorios", "Relatórios"],
      ["/app/configuracoes", "Configurações"],
      ["/app/assinatura", "Assinatura do Marc"],
    ];

    for (const [path, heading] of routes) {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`${path.replaceAll("/", "\\/")}(?:\\?|$)`));
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    }
  });

  test("@responsive painel essencial não cria rolagem horizontal", async ({ page }) => {
    for (const path of ["/app", "/app/agenda", "/app/servicos"]) {
      await page.goto(path);
      const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        page: document.documentElement.scrollWidth,
      }));
      expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport + 1);
    }
  });

  test("equipe cria, inicia e cancela um atendimento sem deixar dados residuais", async ({ page }) => {
    const customerPhone = "11999990002";
    const date = nextOpenDate();
    await cleanupPilotCustomer(customerPhone);

    try {
      await page.goto(`/app/agenda?date=${date}`);
      await page.getByLabel("Cliente").fill("Cliente Operacional E2E");
      await page.getByLabel("WhatsApp").fill(customerPhone);
      await page.getByLabel("Serviço").selectOption({ index: 1 });
      await page.getByLabel("Data e hora").fill(`${date}T10:30`);
      await page.getByRole("button", { name: "Confirmar atendimento" }).click();
      await expect(page.getByText("Atendimento confirmado na agenda.", { exact: true })).toBeVisible();

      const appointment = page.getByRole("link", { name: /Cliente Operacional E2E/ });
      await expect(appointment).toBeVisible();
      await appointment.click();
      await expect(page.getByRole("heading", { level: 2, name: "Cliente Operacional E2E" })).toBeVisible();

      await page.getByRole("button", { name: "Iniciar atendimento" }).click();
      await expect(page.getByText("Status atualizado.", { exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Cancelar" }).click();
      await expect(page.getByText("Status atualizado.", { exact: true })).toBeVisible();
    } finally {
      await cleanupPilotCustomer(customerPhone);
    }
  });
});

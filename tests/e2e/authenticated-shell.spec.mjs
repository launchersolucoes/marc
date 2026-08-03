import { expect, test } from "@playwright/test";

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

test.describe("operação autenticada", () => {
  test.skip(!email || !password, "Defina E2E_EMAIL e E2E_PASSWORD para uma conta exclusiva de piloto.");

  test.beforeEach(async ({ page }) => {
    await page.goto("/entrar");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha").fill(password);
    await page.getByRole("button", { name: "Entrar no Marc" }).click();
    await page.waitForURL(/\/(app|onboarding|master)(\/|$)/);
  });

  test("conta de piloto alcança a área operacional", async ({ page }) => {
    test.skip(new URL(page.url()).pathname === "/onboarding", "A conta E2E ainda precisa concluir o onboarding.");
    test.skip(new URL(page.url()).pathname === "/master", "Use uma conta de estabelecimento, não uma conta Master.");

    await expect(page.getByRole("navigation", { name: "Navegação do painel" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Agenda" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Clientes" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Serviços" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Equipe" })).toBeVisible();
  });
});

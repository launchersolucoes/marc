import { expect, test } from "@playwright/test";

const roles = {
  manager: {
    email: process.env.E2E_MANAGER_EMAIL,
    password: process.env.E2E_MANAGER_PASSWORD,
    label: "Gerente",
  },
  receptionist: {
    email: process.env.E2E_RECEPTIONIST_EMAIL,
    password: process.env.E2E_RECEPTIONIST_PASSWORD,
    label: "Recepção",
  },
  professional: {
    email: process.env.E2E_PROFESSIONAL_EMAIL,
    password: process.env.E2E_PROFESSIONAL_PASSWORD,
    label: "Profissional",
  },
};

const matrixReady = Object.values(roles).every(({ email, password }) => email && password);

async function signIn(page, role) {
  const credentials = roles[role];
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(credentials.email);
  await page.locator('input[name="password"]').fill(credentials.password);
  await page.getByRole("button", { name: "Entrar no Marc" }).click();
  await page.waitForURL(/\/app(?:\/|$)/);
  await expect(page.getByText(credentials.label, { exact: true })).toBeVisible();
}

test.describe("matriz de papéis do estabelecimento", () => {
  test.skip(!matrixReady, "Execute npm run pilot:roles para provisionar as contas da matriz.");

  test("gerente opera agenda, equipe, financeiro e relatórios", async ({ page }) => {
    await signIn(page, "manager");
    const navigation = page.getByRole("navigation", { name: "Navegação do painel" });
    await expect(navigation.getByRole("link", { name: "Agenda", exact: true })).toBeVisible();
    await expect(navigation.getByRole("link", { name: "Financeiro", exact: true })).toBeVisible();
    await expect(navigation.getByRole("link", { name: "Relatórios", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Plano e assinatura", exact: true })).toBeVisible();

    await page.goto("/app/equipe");
    await expect(page.getByRole("heading", { level: 2, name: "Convidar acesso" })).toBeVisible();
  });

  test("recepção vê toda a agenda sem acessar áreas financeiras", async ({ page }) => {
    await signIn(page, "receptionist");
    const navigation = page.getByRole("navigation", { name: "Navegação do painel" });
    await expect(navigation.getByRole("link", { name: "Agenda", exact: true })).toBeVisible();
    await expect(navigation.getByRole("link", { name: "Financeiro", exact: true })).toHaveCount(0);
    await expect(navigation.getByRole("link", { name: "Relatórios", exact: true })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Plano e assinatura", exact: true })).toHaveCount(0);

    await page.goto("/app/agenda");
    await expect(page.getByRole("strong").filter({ hasText: "Profissional Piloto" })).toBeVisible();
    await page.goto("/app/equipe");
    await expect(page.getByRole("heading", { level: 2, name: "Convidar acesso" })).toHaveCount(0);
    await page.goto("/app/financeiro");
    await expect(page).toHaveURL(/\/app$/);
  });

  test("profissional enxerga somente a própria agenda e comissão", async ({ page }) => {
    await signIn(page, "professional");
    const navigation = page.getByRole("navigation", { name: "Navegação do painel" });
    await expect(navigation.getByRole("link", { name: "Financeiro", exact: true })).toHaveCount(0);
    await expect(navigation.getByRole("link", { name: "Relatórios", exact: true })).toHaveCount(0);
    await expect(navigation.getByRole("link", { name: "Comissões", exact: true })).toBeVisible();

    await page.goto("/app/agenda");
    await expect(page.getByRole("strong").filter({ hasText: "Profissional Piloto" })).toBeVisible();
    await expect(page.getByText("Operação Piloto Marc", { exact: true })).toHaveCount(0);
    await page.goto("/app/servicos");
    await expect(page.getByRole("button", { name: "Cadastrar serviço" })).toBeVisible();
    await page.goto("/app/financeiro");
    await expect(page).toHaveURL(/\/app$/);
  });
});

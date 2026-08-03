import { expect, test } from "@playwright/test";

test.describe("superfícies públicas", () => {
  test("landing apresenta a proposta e leva ao cadastro", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Marc/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Sua agenda trabalha");
    await expect(page.getByRole("link", { name: "Reservar teste de 7 dias" })).toHaveAttribute("href", "/cadastro");
    await expect(page.getByRole("navigation", { name: "Navegação principal" })).toBeVisible();
  });

  test("cadastro preserva o próximo destino seguro", async ({ page }) => {
    await page.goto("/cadastro?next=%2Fconvite%2Ftoken-de-teste");

    await expect(page.getByRole("heading", { level: 2, name: "Comece seu teste" })).toBeVisible();
    await expect(page.locator('input[name="next"]')).toHaveValue("/convite/token-de-teste");
    await expect(page.getByLabel("Seu nome")).toHaveAttribute("required", "");
    await expect(page.getByLabel("E-mail")).toHaveAttribute("type", "email");
    await expect(page.locator('input[name="password"]')).toHaveAttribute("minlength", "8");
  });

  test("rota autenticada redireciona visitantes e preserva o destino", async ({ page }) => {
    await page.goto("/app/agenda");

    await expect(page).toHaveURL(/\/entrar\?next=%2Fapp%2Fagenda$/);
    await expect(page.getByRole("heading", { level: 2, name: "Bem-vindo de volta" })).toBeVisible();
    await expect(page.locator('input[name="next"]')).toHaveValue("/app/agenda");
  });

  test("slug inexistente responde como página não encontrada", async ({ page }) => {
    await page.goto("/agendar/estabelecimento-inexistente-e2e");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Este endereço não leva a uma página do Marc");
    await expect(page.getByRole("link", { name: "Voltar ao início", exact: true })).toBeVisible();
    await expect(page.locator('head meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });

  test("@responsive hero mantém texto, prova e produto sem sobreposição", async ({ page }) => {
    await page.goto("/");

    const copy = page.locator(".hero__copy");
    const proof = page.locator(".hero__proof");
    const visual = page.locator(".hero__visual");
    await expect(copy).toBeVisible();
    await expect(proof).toBeVisible();
    await expect(visual).toBeVisible();

    const boxes = await page.evaluate(() => {
      const rect = (selector) => {
        const value = document.querySelector(selector)?.getBoundingClientRect();
        return value
          ? { top: value.top, right: value.right, bottom: value.bottom, left: value.left, width: value.width }
          : null;
      };
      return {
        copy: rect(".hero__copy"),
        proof: rect(".hero__proof"),
        visual: rect(".hero__visual"),
        actions: rect(".hero__actions"),
        viewport: document.documentElement.clientWidth,
      };
    });

    const overlaps = (a, b) =>
      a.top < b.bottom && a.bottom > b.top && a.left < b.right && a.right > b.left;

    expect(boxes.copy).not.toBeNull();
    expect(boxes.proof).not.toBeNull();
    expect(boxes.visual).not.toBeNull();
    expect(boxes.actions).not.toBeNull();
    expect(overlaps(boxes.actions, boxes.proof)).toBe(false);
    expect(overlaps(boxes.copy, boxes.visual)).toBe(false);
    expect(overlaps(boxes.proof, boxes.visual)).toBe(false);
    expect(boxes.visual.width).toBeLessThanOrEqual(boxes.viewport);
  });

  test("@responsive cadastro e recuperação cabem no viewport e preservam alvos de toque", async ({ page }) => {
    for (const path of ["/cadastro", "/recuperar-senha"]) {
      await page.goto(path);

      const layout = await page.evaluate(() => {
        const controls = [...document.querySelectorAll("input, button, a.button")].map((element) => {
          const rect = element.getBoundingClientRect();
          return { width: rect.width, height: rect.height, left: rect.left, right: rect.right };
        });
        return {
          viewport: document.documentElement.clientWidth,
          pageWidth: document.documentElement.scrollWidth,
          controls,
        };
      });

      expect(layout.pageWidth).toBeLessThanOrEqual(layout.viewport + 1);
      for (const control of layout.controls) {
        expect(control.left).toBeGreaterThanOrEqual(-1);
        expect(control.right).toBeLessThanOrEqual(layout.viewport + 1);
        if (control.width > 0) expect(control.height).toBeGreaterThanOrEqual(40);
      }
    }
  });
});

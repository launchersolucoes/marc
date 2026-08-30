import { expect, test } from "@playwright/test";
import { pilotEmail, pilotPassword } from "./pilot-fixture.mjs";

test.describe("direitos de dados", () => {
  test.skip(!pilotEmail || !pilotPassword, "Defina as credenciais da conta proprietária do piloto.");

  test.beforeEach(async ({ page }) => {
    await page.goto("/entrar");
    await page.getByLabel("E-mail").fill(pilotEmail);
    await page.locator('input[name="password"]').fill(pilotPassword);
    await page.getByRole("button", { name: "Entrar no Marc" }).click();
    await page.waitForURL(/\/app(?:\/|$)/);
    await page.goto("/app/configuracoes");
  });

  test("@responsive proprietário encontra exportação e confirma encerramento sem executá-lo", async ({ page }, testInfo) => {
    const panel = page.getByRole("region", { name: "Seus dados no Marc" });
    await expect(panel).toBeVisible();
    await expect(panel.getByRole("link", { name: /Baixar cópia do estabelecimento/ })).toHaveAttribute("href", "/api/account/export");

    await panel.getByRole("button", { name: /Solicitar exclusão dos meus dados/ }).click();
    await expect(page.getByLabel("Contexto para o suporte opcional")).toBeVisible();

    const closureTrigger = panel.getByRole("button", { name: "Revisar encerramento" });
    await closureTrigger.click();
    const dialog = page.getByRole("dialog", { name: /Encerrar/ });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Horários futuros e listas de espera serão cancelados.")).toBeVisible();
    await expect(dialog.getByLabel(/Digite .* para confirmar/)).toBeVisible();
    await expect(dialog.getByRole("checkbox")).not.toBeChecked();
    await expect(dialog.getByRole("button", { name: "Encerrar estabelecimento" })).toBeDisabled();

    const closeButton = dialog.getByRole("button", { name: "Fechar" });
    await expect(closeButton).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(dialog.getByRole("checkbox")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(closeButton).toBeFocused();

    if (testInfo.project.name === "mobile-chromium") {
      const handle = page.locator(".account-closure-handle");
      const box = await handle.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 120, { steps: 5 });
      await page.mouse.up();
      await expect(dialog).toBeHidden();
      await closureTrigger.click();
    } else {
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(closureTrigger).toBeFocused();
      await closureTrigger.click();
    }

    await page.screenshot({ path: testInfo.outputPath(`data-rights-${testInfo.project.name}.png`), fullPage: true });
  });
});

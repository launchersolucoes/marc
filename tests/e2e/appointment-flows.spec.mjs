import { expect, test } from "@playwright/test";
import {
  cleanupPilotCustomer,
  cleanupProfessionalTimeOff,
  nextOpenDate,
} from "./pilot-fixture.mjs";

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
const financialMutationConfirmed = process.env.E2E_FINANCIAL_MUTATION_CONFIRM === "complete-pilot-appointment";

async function signIn(page, role) {
  const credentials = roles[role];
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(credentials.email);
  await page.locator('input[name="password"]').fill(credentials.password);
  await page.getByRole("button", { name: "Entrar no Marc" }).click();
  await page.waitForURL(/\/app(?:\/|$)/);
  await expect(page.getByText(credentials.label, { exact: true })).toBeVisible();
}

async function createAppointment(page, { date, time, customer, phone }) {
  await page.goto(`/app/agenda?date=${date}`);
  const professional = page.getByLabel("Profissional");
  if (await professional.count()) {
    await professional.selectOption({ label: "Profissional Piloto" });
  }
  await page.getByLabel("Cliente").fill(customer);
  await page.getByLabel("WhatsApp").fill(phone);
  await page.getByLabel("Serviço").selectOption({ index: 1 });
  await page.getByLabel("Data e hora").fill(`${date}T${time}`);
  await page.getByRole("button", { name: "Confirmar atendimento" }).click();
  await expect(page.getByText("Atendimento confirmado na agenda.", { exact: true })).toBeVisible();
  const appointment = page.getByRole("link", { name: new RegExp(customer) });
  await expect(appointment).toBeVisible();
  await appointment.click();
  await expect(page.getByRole("heading", { level: 2, name: customer })).toBeVisible();
}

test.describe("ciclo operacional por papel", () => {
  test.skip(!matrixReady, "Execute npm run pilot:roles para provisionar as contas da matriz.");

  test("gerente conclui atendimento e gera caixa e comissão", async ({ page }) => {
    test.skip(!financialMutationConfirmed, "Confirme explicitamente o lançamento contábil no estabelecimento piloto.");
    const phone = "11999990021";
    const customer = "Cliente Gerência E2E";
    const date = nextOpenDate(2);
    await cleanupPilotCustomer(phone);

    try {
      await signIn(page, "manager");
      await createAppointment(page, { date, time: "15:00", customer, phone });
      await page.getByRole("button", { name: "Iniciar atendimento" }).click();
      await expect(page.getByText("Status atualizado.", { exact: true })).toBeVisible();
      await page.getByLabel("Forma de pagamento").selectOption("pix");
      await page.getByRole("button", { name: "Concluir e lançar" }).click();
      await expect(page.getByLabel("Atendimento", { exact: true }).getByText("Concluído", { exact: true })).toBeVisible();

      await page.goto("/app/financeiro");
      await expect(page.getByText("Atendimento do profissional piloto", { exact: true }).first()).toBeVisible();
      await page.goto("/app/comissoes");
      await expect(page.getByText("Profissional Piloto", { exact: true }).first()).toBeVisible();
    } finally {
      await cleanupPilotCustomer(phone);
    }
  });

  test("recepção reagenda e cancela um atendimento da equipe", async ({ page }) => {
    const phone = "11999990022";
    const customer = "Cliente Recepção E2E";
    const date = nextOpenDate(3);
    await cleanupPilotCustomer(phone);

    try {
      await signIn(page, "receptionist");
      await createAppointment(page, { date, time: "10:00", customer, phone });
      await page.getByLabel("Nova data e hora").fill(`${date}T11:00`);
      await page.getByRole("button", { name: "Reagendar" }).click();
      await expect(page.getByText("Atendimento reagendado com sucesso.", { exact: true })).toBeVisible();
      await expect(page.getByRole("definition").filter({ hasText: "11:00" })).toBeVisible();
      await page.getByRole("button", { name: "Cancelar" }).click();
      await expect(page.getByLabel("Atendimento", { exact: true }).getByText("Cancelado", { exact: true })).toBeVisible();
    } finally {
      await cleanupPilotCustomer(phone);
    }
  });

  test("profissional bloqueia a própria agenda e impede conflito", async ({ page }) => {
    const phone = "11999990023";
    const customer = "Cliente Bloqueio E2E";
    const reason = "Bloqueio operacional E2E";
    const date = nextOpenDate(4);
    await cleanupPilotCustomer(phone);
    await cleanupProfessionalTimeOff(reason);

    try {
      await signIn(page, "professional");
      await page.goto(`/app/agenda?view=disponibilidade&date=${date}`);
      await page.getByLabel("Início", { exact: true }).fill(`${date}T13:00`);
      await page.getByLabel("Fim", { exact: true }).fill(`${date}T14:00`);
      await page.getByLabel("Motivo").fill(reason);
      await page.getByRole("button", { name: "Bloquear período" }).click();
      await expect(page.getByText("Período bloqueado na sua agenda.", { exact: true })).toBeVisible();
      await expect(page.getByText(reason, { exact: true })).toBeVisible();

      await page.goto(`/app/agenda?date=${date}`);
      await page.getByLabel("Cliente").fill(customer);
      await page.getByLabel("WhatsApp").fill(phone);
      await page.getByLabel("Serviço").selectOption({ index: 1 });
      await page.getByLabel("Data e hora").fill(`${date}T13:15`);
      await page.getByRole("button", { name: "Confirmar atendimento" }).click();
      await expect(page.getByText("Esse período está bloqueado na agenda.", { exact: true })).toBeVisible();
    } finally {
      await cleanupPilotCustomer(phone);
      await cleanupProfessionalTimeOff(reason);
    }
  });
});

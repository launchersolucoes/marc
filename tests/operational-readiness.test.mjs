import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("provides branded recovery states for route, app and global failures", async () => {
  const [routeError, appError, globalError, notFound] = await Promise.all([
    read("src/app/error.jsx"),
    read("src/app/app/error.jsx"),
    read("src/app/global-error.jsx"),
    read("src/app/not-found.jsx"),
  ]);

  assert.match(routeError, /onRetry=\{reset\}/);
  assert.match(appError, /antes de repetir qualquer cadastro ou agendamento/);
  assert.match(globalError, /Nada foi apagado/);
  assert.match(notFound, /Página não encontrada/);
});

test("server error telemetry excludes request and customer payloads", async () => {
  const instrumentation = await read("src/instrumentation.js");

  assert.match(instrumentation, /onRequestError/);
  assert.match(instrumentation, /context\?\.routePath/);
  assert.match(instrumentation, /VERCEL_GIT_COMMIT_SHA/);
  assert.match(instrumentation, /VERCEL_ENV/);
  assert.doesNotMatch(instrumentation, /errorRequest\.(headers|path)/);
  assert.doesNotMatch(instrumentation, /error\?\.message/);
});

test("critical dynamic surfaces expose explicit loading feedback", async () => {
  const [appLoading, bookingLoading] = await Promise.all([
    read("src/app/app/loading.jsx"),
    read("src/app/agendar/[slug]/loading.jsx"),
  ]);

  assert.match(appLoading, /aria-busy="true"/);
  assert.match(appLoading, /app-native-loading__summary/);
  assert.match(appLoading, /app-native-loading__list/);
  assert.match(bookingLoading, /Buscando horários disponíveis/);
});

test("incomplete onboarding accounts can switch users and cannot skip required setup fields", async () => {
  const [page, form] = await Promise.all([
    readFile("src/app/onboarding/page.jsx", "utf8"),
    readFile("src/components/onboarding-form.jsx", "utf8"),
  ]);

  assert.match(page, /form action=\{signOut\}/);
  assert.match(page, /Sair desta conta e entrar com outra/);
  assert.match(form, /reportValidity\(\)/);
  assert.match(form, /onClick=\{continueToAddress\}/);
});

test("health endpoint verifies Supabase availability without exposing configuration", async () => {
  const health = await read("src/app/api/health/route.js");

  assert.match(health, /\/auth\/v1\/health/);
  assert.match(health, /method: "GET"/);
  assert.match(health, /AbortSignal\.timeout\(5000\)/);
  assert.match(health, /Cache-Control/);
  assert.match(health, /status: "degraded"/);
  assert.doesNotMatch(health, /Response\.json\([^)]*(supabaseUrl|publishableKey)/);
});

test("PWA is installable and keeps authenticated documents out of offline caches", async () => {
  const [layout, manifest, registration, worker, settings] = await Promise.all([
    read("src/app/layout.jsx"),
    read("src/app/manifest.js"),
    read("src/components/pwa-registration.jsx"),
    read("public/sw.js"),
    read("src/components/pwa-install-card.jsx"),
  ]);

  assert.match(layout, /manifest: "\/manifest\.webmanifest"/);
  assert.match(layout, /appleWebApp/);
  assert.match(layout, /apple: "\/icon\.png"/);
  assert.match(manifest, /display: "standalone"/);
  assert.match(manifest, /start_url: "\/app"/);
  assert.match(registration, /serviceWorker\.register\("\/sw\.js"/);
  assert.match(registration, /process\.env\.NODE_ENV !== "production"/);
  assert.match(registration, /registration\.unregister\(\)/);
  assert.match(worker, /request\.mode === "navigate"/);
  assert.match(worker, /marc-static-v2/);
  assert.match(worker, /fetch\(request\)\.catch\(\(\) => caches\.match\(OFFLINE_URL\)\)/);
  assert.doesNotMatch(worker, /request\.mode === "navigate"[\s\S]{0,240}cache\.put/);
  assert.match(settings, /beforeinstallprompt/);
  assert.match(settings, /Adicionar à Tela de Início/);
});

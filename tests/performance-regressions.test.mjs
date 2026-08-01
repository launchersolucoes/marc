import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("app context is loaded in one RPC alongside authentication", async () => {
  const [appContext, actionContext] = await Promise.all([
    read("../src/lib/app-context.js"),
    read("../src/lib/action-context.js"),
  ]);

  for (const source of [appContext, actionContext]) {
    assert.match(source, /Promise\.all/);
    assert.match(source, /rpc\("get_current_app_context"\)/);
    assert.doesNotMatch(source, /from\("establishment_memberships"\)/);
  }
});

test("context RPC remains scoped to the authenticated user", async () => {
  const migration = await read("../supabase/migrations/20260801030000_fast_app_context.sql");

  assert.match(migration, /security invoker/i);
  assert.match(migration, /membership\.user_id = auth\.uid\(\)/);
  assert.match(migration, /grant execute[\s\S]*to authenticated/i);
  assert.match(migration, /revoke all[\s\S]*from public, anon/i);
});

test("authenticated navigation exposes immediate progress feedback", async () => {
  const [shell, progress] = await Promise.all([
    read("../src/components/app-shell.jsx"),
    read("../src/components/app-navigation-progress.jsx"),
  ]);

  assert.match(shell, /<AppNavigationProgress \/>/);
  assert.match(progress, /app-route-progress/);
  assert.match(progress, /usePathname/);
});

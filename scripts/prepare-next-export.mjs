#!/usr/bin/env node
import { copyFileSync, cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, ".next", "server", "app", "index.html");
const staticSource = path.join(root, ".next", "static");
const publicSource = path.join(root, "public");
const target = path.join(root, "dist", "client");

if (!existsSync(source) || !existsSync(staticSource)) {
  throw new Error("Missing prerendered Next.js landing page or static assets");
}

rmSync(target, { force: true, recursive: true });
mkdirSync(target, { recursive: true });
copyFileSync(source, path.join(target, "index.html"));
mkdirSync(path.join(target, "_next"), { recursive: true });
cpSync(staticSource, path.join(target, "_next", "static"), { recursive: true });
if (existsSync(publicSource)) cpSync(publicSource, target, { recursive: true });

console.log("Prepared landing snapshot: dist/client");

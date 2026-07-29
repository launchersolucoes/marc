#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "out");
const target = path.join(root, "dist", "client");

if (!existsSync(path.join(source, "index.html"))) {
  throw new Error("Missing Next.js static export: out/index.html");
}

rmSync(target, { force: true, recursive: true });
mkdirSync(target, { recursive: true });
cpSync(source, target, { recursive: true });

console.log("Prepared Next.js export: dist/client");

#!/usr/bin/env node
"use strict";

import fs from "fs";
import path from "path";
import { createRequire } from "module";

const pkg = readPackage();
if (pkg?.type === "module") {
  await import("../dist-mjs/main.mjs");
} else {
  createRequire(import.meta.url)("../dist-cjs/main.cjs");
}

function readPackage() {
  const fileName = "package.json";
  let dir = process.cwd();
  let count = 0;
  let pkgPath = path.join(dir, fileName);
  while (
    count++ < 16 &&
    !fs.existsSync(pkgPath) &&
    path.dirname(dir) != dir &&
    dir.startsWith(path.dirname(dir))
  ) {
    dir = path.dirname(dir);
    pkgPath = path.join(dir, fileName);
  }
  if (fs.existsSync(pkgPath)) {
    const text = fs.readFileSync(pkgPath, "utf-8");
    return JSON.parse(text);
  }
  return null;
}

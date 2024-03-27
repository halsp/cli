#!/usr/bin/env node
"use strict";

import { createRequire } from "module";

if (process.env.npm_package_type === "module") {
  await import("../dist-mjs/main.mjs");
} else {
  createRequire(import.meta.url)("../dist-cjs/main.cjs");
}

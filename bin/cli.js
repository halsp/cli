#!/usr/bin/env node

"use strict";

import { createRequire } from "module";

if (process.env.PACKAGE_TYPE === "module") {
  await import("../dist-mjs/main.mjs");
} else {
  createRequire(import.meta.url)("../dist-cjs/main.cjs");
}

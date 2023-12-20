"use strict";

import { createRequire } from "module";

if (process.env.npm_package_type === "module") {
  await import("../dist-mjs/create-halsp.mjs");
} else {
  createRequire(import.meta.url)("../dist-cjs/create-halsp.cjs");
}

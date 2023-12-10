import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { defineConfig } = require("../../../../src");

module.exports = defineConfig(({ mode }) => {
  return {
    start: {
      startupFile: "t1",
    },
  };
});

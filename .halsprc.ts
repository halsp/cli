import { defineConfig } from "./src";
import { transformer } from "./scripts/transpiler.js";

export default defineConfig(({ mode }) => {
  return {
    build: {
      afterHooks: [(p) => transformer],
    },
  };
});

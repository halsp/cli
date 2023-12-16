import { defineConfig } from "./src";
import { addJsExtTransformer } from "./scripts/add-js-ext.js";

export default defineConfig(({ mode }) => {
  return {
    build: {
      afterHooks: [(p) => addJsExtTransformer],
    },
  };
});

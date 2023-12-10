import { defineConfig } from "./src";
import transformer from "./src/utils/suffix-transformer";

export default defineConfig(({ mode }) => {
  return {
    build: {
      afterHooks: [() => transformer],
    },
  };
});

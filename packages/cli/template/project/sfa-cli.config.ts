import { defineConfig } from "@sfajs/cli";

export default defineConfig((mode) => ({
  build: {
    assets: ["src/views"],
  },
}));

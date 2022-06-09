import { defineConfig } from "@sfajs/cli-common";

export default defineConfig(() => {
  return {
    build: {
      assets: ["assets"],
    },
  };
});

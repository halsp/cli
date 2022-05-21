import { Configuration, defineConfig } from "@sfajs/cli";

export default defineConfig((mode) => {
  return {
    build: {
      assets: ["assets"],
    },
  } as Configuration;
});

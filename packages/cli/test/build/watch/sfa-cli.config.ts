import { Configuration, defineConfig } from "@sfajs/cli";

export default defineConfig(() => {
  return {
    build: {
      assets: ["assets"],
    },
  } as Configuration;
});

import { defineConfig } from "@ipare/cli-config";

export default defineConfig(() => {
  return {
    build: {
      assets: ["assets"],
    },
  };
});

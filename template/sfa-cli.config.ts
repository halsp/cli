import { defineConfig } from "@sfajs/cli";

export default defineConfig(() => ({
  build: {
    assets: [
      {
        include: "views",
        root: "src",
      },
    ],
  },
  packageManager: "{{PACKAGE_MANAGER}}",
}));

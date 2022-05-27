import { defineConfig } from "@sfajs/cli";

export default defineConfig({
  build: {
    assets: [
      "default/**/*",
      {
        include: "include/**/*",
      },
      {
        include: "exclude/**/*",
        exclude: "exclude/**/*.txt",
      },
      {
        include: "root/**/*",
        root: "src",
      },
      {
        include: "outDir/**/*",
        outDir: "test",
      },
    ],
  },
});

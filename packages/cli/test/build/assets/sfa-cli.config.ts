import path from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { defineConfig } = require("../../src/configuration");
export default defineConfig(({ dirname }) => ({
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
        root: path.join(dirname, "src"),
      },
      {
        include: "outDir/**/*",
        outDir: "test",
      },
    ],
  },
}));

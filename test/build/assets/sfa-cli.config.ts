import { defineConfig } from "@sfajs/cli";
import path from "path";

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

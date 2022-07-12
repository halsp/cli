import path from "path";
import { defineConfig } from "@ipare/cli-common";

export default defineConfig(() => ({
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
        root: path.join(__dirname, "src"),
      },
      {
        include: "outDir/**/*",
        outDir: "test",
      },
    ],
  },
}));

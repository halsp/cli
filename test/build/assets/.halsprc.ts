import path from "path";
import { defineConfig } from "../../../src";
import { createDirname } from "../../../src/utils/shims";

const __dirname = createDirname(import.meta.url);

export default defineConfig(() => ({
  build: {
    assets: [
      "default/**/*",
      {
        include: ["include/**/*"],
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

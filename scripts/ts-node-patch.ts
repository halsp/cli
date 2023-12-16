import { createRequire, createDirname } from "../src/utils/shims.js";
import fs from "fs";
import path from "path";

const require = createRequire(import.meta.url);
const dirname = createDirname(import.meta.url);
const flag = "/* halsp-cli-compiler */ ";

const transpilerPath = path
  .join(dirname, "./transpiler.cjs")
  .replace(/\\/g, "/");
const codeLine = `${flag}code = require('${transpilerPath}').replaceCode(code, fileName);`;

const tsNodePath = require.resolve("ts-node");
const code = await fs.promises.readFile(tsNodePath, "utf-8");
const lines = code.replace(/\r\n/, "\n").split("\n");
for (const line of lines) {
  if (line.includes("function compile(")) {
    const index = lines.indexOf(line);
    if (!lines[index + 1].startsWith(flag)) {
      lines.splice(index + 1, 0, codeLine);
    }
    break;
  }
}

await fs.promises.writeFile(tsNodePath, lines.join("\n"));

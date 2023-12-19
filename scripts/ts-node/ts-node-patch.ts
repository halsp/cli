import fs from "fs";
import path from "path";
import { createRequire } from "node:module";
import { fileURLToPath } from "url";

export const flag = "/* halsp-cli-add-shims */ ";

const transpilerPath = path
  .join(path.dirname(fileURLToPath(import.meta.url)), "./add-shims.cjs")
  .replace(/\\/g, "/");
const addShimsCode = `${flag}contents = require('${transpilerPath}').addShims(contents, fileName);`;

const tsNodePath = createRequire(import.meta.url).resolve("ts-node");
const code = await fs.promises.readFile(tsNodePath, "utf-8");
const lines = code.replace(/\r\n/, "\n").split("\n");

let lineIndex = 0;
while (lineIndex < lines.length - 1) {
  const line = lines[lineIndex];
  if (line.includes("const updateMemoryCache =")) {
    if (lines[lineIndex + 1].startsWith(flag)) {
      lines.splice(lineIndex + 1, 1, addShimsCode);
    } else {
      lines.splice(lineIndex + 1, 0, addShimsCode);
    }
  }
  lineIndex++;
}

await fs.promises.writeFile(tsNodePath, lines.join("\n"));

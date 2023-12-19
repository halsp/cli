import fs from "fs";
import { createRequire } from "node:module";
import { flag } from "./ts-node-patch.js";

const tsNodePath = createRequire(import.meta.url).resolve("ts-node");
const code = await fs.promises.readFile(tsNodePath, "utf-8");
const lines = code.replace(/\r\n/, "\n").split("\n");

let lineIndex = 0;
while (lineIndex < lines.length - 1) {
  if (lines[lineIndex + 1].startsWith(flag)) {
    lines.splice(lineIndex + 1, 1);
  } else {
    lineIndex++;
  }
}

await fs.promises.writeFile(tsNodePath, lines.join("\n"));

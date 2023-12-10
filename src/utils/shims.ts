import path from "path";
import { fileURLToPath } from "url";
import m from "node:module";

export function createDirname(url: string) {
  return path.dirname(fileURLToPath(url));
}
export function createRequire(url: string) {
  return m.createRequire(url);
}

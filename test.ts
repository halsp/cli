import walk from "ignore-walk";
import path from "path";
import * as fs from "fs";

console.log(
  'path.join(__dirname, "template/project/.gitignore")',
  path.join(__dirname, "template/project/.gitignore"),
  fs.existsSync(path.join(__dirname, "template/project/.gitignore"))
);
const ps = walk.sync({
  path: path.join(__dirname, "template/project"),
  ignoreFiles: [".gitignore"],
});
console.log("ps", ps);

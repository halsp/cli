import * as fs from "fs";
import path from "path";
import prettier from "prettier";

const root = path.join(__dirname, "../..");
const baseReadme = fs.readFileSync(path.join(root, "README.md"), "utf-8");
const miniReadme = fs.readFileSync(path.join(__dirname, "README.md"), "utf-8");
const introRegExp = /<!--intro-->([\s\S]+?)<!--intro-end-->/m;
const readme = baseReadme.replace(introRegExp, miniReadme);

fs.writeFileSync(
  path.join(root, "minimal/README.md"),
  prettier.format(readme, {
    parser: "markdown",
  })
);

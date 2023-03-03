import * as fs from "fs";
import prettier from "prettier";

function editPackage() {
  const pkg = JSON.parse(fs.readFileSync("./package.json", "utf-8"));
  pkg.name = "create-halsp";
  pkg.description = "Halsp 快速开始脚手架工具，由 @halsp/cli 自动生成";
  pkg.dependencies["@halsp/cli"] = pkg.version;
  pkg.main = "dist/create-halsp.js";

  delete pkg.bin["halsp"];
  pkg.bin["create-halsp"] = "bin/create-halsp.js";

  fs.writeFileSync(
    "./package.json",
    prettier.format(JSON.stringify(pkg), {
      parser: "json",
    })
  );
}

function editTsconfig() {
  const tsconfig = JSON.parse(fs.readFileSync("./tsconfig.json", "utf-8"));
  tsconfig.include = ["src/create-halsp.ts"];

  fs.writeFileSync(
    "./tsconfig.json",
    prettier.format(JSON.stringify(tsconfig), {
      parser: "json",
    })
  );
}

function editReadme() {
  const readme = fs.readFileSync("./create-halsp.README.md", "utf-8");
  fs.writeFileSync("./README.md", readme);
}

editTsconfig();
editPackage();
editReadme();

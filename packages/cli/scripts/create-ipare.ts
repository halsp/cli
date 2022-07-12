import * as fs from "fs";
import prettier from "prettier";

function editPackage() {
  const pkg = JSON.parse(fs.readFileSync("./package.json", "utf-8"));
  pkg.name = "create-ipare";
  pkg.description = "Ipare 快速开始脚手架工具，由 @ipare/cli 自动生成";
  pkg.dependencies["@ipare/cli"] = pkg.version;
  pkg.main = "dist/create-ipare.js";

  delete pkg.bin["ipare"];
  pkg.bin["create-ipare"] = "bin/create-ipare.js";

  fs.writeFileSync(
    "./package.json",
    prettier.format(JSON.stringify(pkg), {
      parser: "json",
    })
  );
}

function editTsconfig() {
  const tsconfig = JSON.parse(fs.readFileSync("./tsconfig.json", "utf-8"));
  tsconfig.include = ["src/create-ipare.ts"];

  fs.writeFileSync(
    "./tsconfig.json",
    prettier.format(JSON.stringify(tsconfig), {
      parser: "json",
    })
  );
}

function editReadme() {
  const readme = fs.readFileSync("./create-ipare.README.md", "utf-8");
  fs.writeFileSync("./README.md", readme);
}

editTsconfig();
editPackage();
editReadme();

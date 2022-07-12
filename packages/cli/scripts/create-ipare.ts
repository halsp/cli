import * as fs from "fs";
import prettier from "prettier";

function editPackage() {
  const pkg = JSON.parse(fs.readFileSync("./package.json", "utf-8"));
  pkg.name = "create-ipare";
  pkg.description = "Ipare 快速开始脚手架工具，由 @ipare/cli 自动生成";
  pkg.dependencies["@ipare/cli"] = pkg.version;

  fs.renameSync("./package.json", "./package.bak.json");

  fs.writeFileSync(
    "./package.json",
    prettier.format(JSON.stringify(pkg), {
      parser: "json",
    })
  );
}

function editReadme() {
  const readme = fs.readFileSync("./README.md", "utf-8");
  fs.writeFileSync("./README.md", readme);
}

editPackage();
editReadme();

import * as fs from "fs";
import prettier from "prettier";

function editPackage() {
  const pkg = JSON.parse(fs.readFileSync("./package.json", "utf-8"));
  pkg.name = "@ipare/cli-config";
  pkg.description = "@ipare/cli 基础功能";

  delete pkg.dependencies["@ipare/cli-config"];
  delete pkg.bin;

  fs.writeFileSync(
    "./package.json",
    prettier.format(JSON.stringify(pkg), {
      parser: "json",
    })
  );
}

function editReadme() {
  const readme = fs.readFileSync("./cli-config.README.md", "utf-8");
  fs.writeFileSync("./README.md", readme);
}

editReadme();
editPackage();

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
  let readme = fs.readFileSync("./README.md", "utf-8");
  readme = readme.replace(
    /\<\!\-\-introduce start\-\-\>[\s\S]*\<\!\-\-introduce end\-\-\>/,
    ""
  );
  readme = readme.replace(/<\!\-\-create\-ipare/, "");
  readme = readme.replace(/create\-ipare\-\-\>/, "");
  fs.writeFileSync(
    "./README.md",
    prettier.format(readme, {
      parser: "markdown",
    })
  );
}

editPackage();
editReadme();

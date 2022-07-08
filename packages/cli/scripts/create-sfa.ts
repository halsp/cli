import * as fs from "fs";
import prettier from "prettier";

const pkg = JSON.parse(fs.readFileSync("./package.json", "utf-8"));
pkg.name = "create-sfa";
pkg.description = "sfajs 快速开始脚手架工具";

fs.renameSync("./package.json", "./package.bak.json");

fs.writeFileSync(
  "./package.json",
  prettier.format(JSON.stringify(pkg), {
    parser: "json",
  })
);

import * as fs from "fs";
import prettier from "prettier";

async function editPackage() {
  const pkg = JSON.parse(fs.readFileSync("./package.json", "utf-8"));
  pkg.name = "create-halsp";
  pkg.description = "Halsp 快速开始脚手架工具，由 @halsp/cli 自动生成";
  pkg.dependencies["@halsp/cli"] = pkg.version;
  pkg.main = "dist/create-halsp.js";

  delete pkg.bin["halsp"];
  pkg.bin["create-halsp"] = "bin/create-halsp.js";

  await fs.promises.writeFile(
    "./package.json",
    await prettier.format(JSON.stringify(pkg), {
      parser: "json",
    }),
  );
}

async function editTsconfig() {
  const tsconfig = JSON.parse(fs.readFileSync("./tsconfig.json", "utf-8"));
  tsconfig.include = ["src/create-halsp.ts"];

  await fs.promises.writeFile(
    "./tsconfig.json",
    await prettier.format(JSON.stringify(tsconfig), {
      parser: "json",
    }),
  );
}

async function editReadme() {
  const readme = fs.readFileSync("./create-halsp.README.md", "utf-8");
  await fs.promises.writeFile("./README.md", readme);
}

(async () => {
  await editTsconfig();
  await editPackage();
  await editReadme();
})();

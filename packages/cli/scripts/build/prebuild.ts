import * as fs from "fs";

function editPackage() {
  let pkgStr = fs.readFileSync("./package.json", "utf-8");
  const pkg = JSON.parse(pkgStr);
  pkgStr = pkgStr.replace(
    '"@ipare/cli-config": "*"',
    `"@ipare/cli-config": "${pkg.version}"`
  );

  fs.writeFileSync("./package.json", pkgStr);
}

editPackage();

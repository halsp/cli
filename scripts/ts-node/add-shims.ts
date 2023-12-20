import path from "path";
import fs from "fs";
import ts from "typescript";

function getImportPath(node: ts.Node, sf: ts.SourceFile) {
  if (!node) return;

  const result = node
    .getText(sf)
    .replace(/^\'/, "")
    .replace(/^\"/, "")
    .replace(/\'$/, "")
    .replace(/\"$/, "");

  if (!result || !result.match(/^\..*$/) || !!result.match(/\.(c|m)?js$/)) {
    return;
  }

  return result;
}

function getNewImportPath(importPath: string, sf: ts.SourceFile) {
  const dir = path.dirname(sf.fileName);
  const impFile = path.join(dir, importPath);
  if (fs.existsSync(impFile) && fs.statSync(impFile).isDirectory()) {
    return importPath + "/index.js";
  } else {
    return importPath + ".js";
  }
}

function isImportOrExportDeclaration(
  node: ts.Node,
): node is ts.ImportDeclaration | ts.ExportDeclaration {
  if (ts.isImportDeclaration(node) && !node.importClause?.isTypeOnly) {
    return true;
  }
  if (ts.isExportDeclaration(node) && !node.isTypeOnly) {
    return true;
  }

  return false;
}

function getNewImportLine(
  statement: ts.Statement | ts.StringLiteral,
  sf: ts.SourceFile,
) {
  if (!isImportOrExportDeclaration(statement)) return;

  const text = statement.getText(sf);
  const node = statement
    .getChildren(sf)
    .filter((c) => ts.isStringLiteral(c))[0];
  const importPath = getImportPath(node, sf);
  if (!importPath) return;
  const newImportPath = getNewImportPath(importPath, sf);
  if (!newImportPath) return;

  return text.replace(importPath, newImportPath);
}

export function addShims(input: string, fileName: string) {
  const sf = ts.createSourceFile(fileName, input, ts.ScriptTarget.ES2022);
  input = sf.statements
    .flatMap((statement) => {
      const newText = getNewImportLine(statement, sf);
      if (newText) {
        const oldText = statement.getText(sf);
        return {
          old: oldText,
          new: newText,
        };
      }
    })
    .filter((item) => !!item)
    .map((item) => item!)
    .reduce((code, node) => code.replace(node.old, node.new), input);

  const requireCode = `
  import _halsp_cli_shims_module from "module";
  const _require=_halsp_cli_shims_module.createRequire(import.meta.url);`;
  if (
    input.includes("_require") &&
    !input.includes("_halsp_cli_shims_module")
  ) {
    input = requireCode + "\n" + input;
  }

  const dirnameCode = `import _halsp_cli_shims_path from "path";
  import _halsp_cli_shims_url from "url";
  const __dirname=_halsp_cli_shims_path.dirname(_halsp_cli_shims_url.fileURLToPath(import.meta.url));`;
  if (input.includes("__dirname") && !input.includes("_halsp_cli_shims_path")) {
    input = dirnameCode + "\n" + input;
  }

  return input;
}

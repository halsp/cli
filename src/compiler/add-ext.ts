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

function getNewImportPath(importPath: string, sf: ts.SourceFile, ext: string) {
  const dir = path.dirname(sf.fileName);
  const impFile = path.join(dir, importPath);
  if (fs.existsSync(impFile) && fs.statSync(impFile).isDirectory()) {
    return importPath + "/index" + ext;
  } else {
    return importPath + ext;
  }
}

function createNewImportNode(node: ts.StringLiteral, ext: string) {
  const sf = node.getSourceFile();
  const importPath = getImportPath(node, sf);
  if (!importPath) return;

  const newImportPath = getNewImportPath(importPath, sf, ext);
  if (!newImportPath) return;

  return ts.factory.createStringLiteral(newImportPath);
}

export function createAddExtTransformer(
  ext: string,
): ts.TransformerFactory<ts.SourceFile> {
  return (context) => {
    const visit: ts.Visitor = (node) => {
      if (
        ts.isStringLiteral(node) &&
        node.parent &&
        (ts.isImportDeclaration(node.parent) ||
          ts.isExportDeclaration(node.parent))
      ) {
        const newNode = createNewImportNode(node, ext);
        if (newNode) return newNode;
      }

      return ts.visitEachChild(node, visit, context);
    };

    return (sf) => ts.visitEachChild(sf, visit, context);
  };
}

import path from "path";
import fs from "fs";
import ts from "typescript";

function getImportPath(node: ts.Node, sf: ts.SourceFile) {
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
  return ts.factory.createStringLiteral(newImportPath);
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

function isNodeShouldUpdate(node: ts.Node): node is ts.StringLiteral {
  if (!ts.isStringLiteral(node)) return false;
  if (!node.parent) return false;

  return isImportOrExportDeclaration(node.parent);
}

export function createAddExtTransformer(
  ext: string,
): ts.TransformerFactory<ts.SourceFile> {
  return (context) => {
    const visit = (sf: ts.SourceFile, node: ts.Node) => {
      if (isNodeShouldUpdate(node)) {
        const newNode = createNewImportNode(node, ext);
        if (newNode) return newNode;
      }
      return ts.visitEachChild(node, (node) => visit(sf, node), context);
    };

    return (sf) => ts.visitEachChild(sf, (node) => visit(sf, node), context);
  };
}

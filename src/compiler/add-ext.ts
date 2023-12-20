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

function isNodeShouldUpdate(node: ts.Node): node is ts.StringLiteral {
  if (!ts.isStringLiteral(node)) return false;
  if (!node.parent) return false;
  if (node.parent["isTypeOnly"]) return false;

  if (ts.isImportDeclaration(node.parent)) {
    return true;
  }

  if (ts.isExportDeclaration(node.parent)) {
    return true;
  }

  return false;
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

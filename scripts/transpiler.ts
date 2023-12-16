import path from "path";
import fs from "fs";
import type { TranspilerFactory, TranspileOptions } from "ts-node";
import ts from "typescript";
import { SourceFile } from "typescript";

export const create: TranspilerFactory = () => {
  return {
    transpile: (input: string, o: TranspileOptions) => {
      const output = transpileFile(o.fileName, input);
      return {
        outputText: output.outputText,
        diagnostics: output.diagnostics,
        sourceMapText: output.sourceMapText ?? "{}",
      };
    },
  };
};

function transpileFile(fileName: string, input: string) {
  const sf = ts.createSourceFile(fileName, input, ts.ScriptTarget.ES2022);

  const output = sf.statements
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

  const parsedCmd = ts.getParsedCommandLineOfConfigFile(
    path.join(__dirname, "../tsconfig.json"),
    undefined,
    ts.sys as unknown as ts.ParseConfigFileHost,
  );
  const { options } = parsedCmd!;

  return ts.transpileModule(output, {
    compilerOptions: options,
    fileName: fileName,
  });
}

function getImportPath(node: ts.Node, sf: SourceFile) {
  if (!node) return;

  const result = node
    .getText(sf)
    .replace(/^\'/, "")
    .replace(/^\"/, "")
    .replace(/\'$/, "")
    .replace(/\"$/, "");

  if (!result || !result.match(/^\..*$/) || !!result.match(/\.(c|e)?js$/)) {
    return;
  }

  return result;
}

function getNewImportPath(importPath: string, sf: SourceFile) {
  const dir = path.dirname(sf.fileName);
  const impFile = path.join(dir, importPath);
  if (fs.existsSync(impFile) && fs.statSync(impFile).isDirectory()) {
    return importPath + "/index.js";
  } else {
    return importPath + ".js";
  }
}

function getNewImportLine(
  statement: ts.Statement | ts.StringLiteral,
  sf: SourceFile,
) {
  if (
    !ts.isImportDeclaration(statement) &&
    !ts.isExportDeclaration(statement)
  ) {
    return;
  }

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

export const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
  const createNewNode = (node: ts.StringLiteral) => {
    const sf = node.getSourceFile();
    const importPath = getImportPath(node, sf);
    if (!importPath) return;

    const newImportPath = getNewImportPath(importPath, sf);
    if (!newImportPath) return;

    return ts.factory.createStringLiteral(newImportPath);
  };

  const visit: ts.Visitor = (node) => {
    if (
      ts.isStringLiteral(node) &&
      node.parent &&
      ts.isImportDeclaration(node.parent)
    ) {
      const newNode = createNewNode(node);
      if (newNode) return newNode;
    }

    return ts.visitEachChild(node, visit, context);
  };

  return (node) => ts.visitEachChild(node, visit, context);
};

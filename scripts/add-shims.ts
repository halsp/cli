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

function getNewImportLine(
  statement: ts.Statement | ts.StringLiteral,
  sf: ts.SourceFile,
  ext: string,
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
  const newImportPath = getNewImportPath(importPath, sf, ext);
  if (!newImportPath) return;

  return text.replace(importPath, newImportPath);
}

function createNewImportNode(node: ts.StringLiteral, ext: string) {
  const sf = node.getSourceFile();
  const importPath = getImportPath(node, sf);
  if (!importPath) return;

  const newImportPath = getNewImportPath(importPath, sf, ext);
  if (!newImportPath) return;

  return ts.factory.createStringLiteral(newImportPath);
}

function createShimsStatements(sf: ts.SourceFile) {
  const code = sf.getText();
  if (code.includes("_halsp_cli_shims_module")) return [];
  const nodes: ts.Statement[] = [];
  if (code.includes("_require")) {
    nodes.push(
      ts.factory.createImportDeclaration(
        undefined,
        ts.factory.createImportClause(
          false,
          ts.factory.createIdentifier("_halsp_cli_shims_module"),
          undefined,
        ),
        ts.factory.createStringLiteral("module"),
      ),
    );
    nodes.push(
      ts.factory.createVariableStatement(
        undefined,
        ts.factory.createVariableDeclarationList(
          [
            ts.factory.createVariableDeclaration(
              ts.factory.createIdentifier("_require"),
              undefined,
              undefined,
              ts.factory.createCallExpression(
                ts.factory.createPropertyAccessExpression(
                  ts.factory.createIdentifier("_halsp_cli_shims_module"),
                  ts.factory.createIdentifier("createRequire"),
                ),
                undefined,
                [
                  ts.factory.createPropertyAccessExpression(
                    ts.factory.createMetaProperty(
                      ts.SyntaxKind.ImportKeyword,
                      ts.factory.createIdentifier("meta"),
                    ) as ts.Expression,
                    "url",
                  ),
                ],
              ),
            ),
          ],
          ts.NodeFlags.Const,
        ),
      ),
    );
  }
  if (code.includes("__dirname")) {
    nodes.push(
      ts.factory.createImportDeclaration(
        undefined,
        ts.factory.createImportClause(
          false,
          ts.factory.createIdentifier("_halsp_cli_shims_path"),
          undefined,
        ),
        ts.factory.createStringLiteral("path"),
      ),
    );
    nodes.push(
      ts.factory.createImportDeclaration(
        undefined,
        ts.factory.createImportClause(
          false,
          ts.factory.createIdentifier("_halsp_cli_shims_url"),
          undefined,
        ),
        ts.factory.createStringLiteral("url"),
      ),
    );
    nodes.push(
      ts.factory.createVariableStatement(
        undefined,
        ts.factory.createVariableDeclarationList(
          [
            ts.factory.createVariableDeclaration(
              ts.factory.createIdentifier("__dirname"),
              undefined,
              undefined,
              ts.factory.createCallExpression(
                ts.factory.createPropertyAccessExpression(
                  ts.factory.createIdentifier("_halsp_cli_shims_path"),
                  ts.factory.createIdentifier("dirname"),
                ),
                undefined,
                [
                  ts.factory.createCallExpression(
                    ts.factory.createPropertyAccessExpression(
                      ts.factory.createIdentifier("_halsp_cli_shims_url"),
                      ts.factory.createIdentifier("fileURLToPath"),
                    ),
                    undefined,
                    [
                      ts.factory.createPropertyAccessExpression(
                        ts.factory.createMetaProperty(
                          ts.SyntaxKind.ImportKeyword,
                          ts.factory.createIdentifier("meta"),
                        ) as ts.Expression,
                        "url",
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
          ts.NodeFlags.Const,
        ),
      ),
    );
  }

  return nodes;
}

export function createAddShimsTransformer(
  ext = ".js",
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

    return (sf) => {
      sf = ts.factory.updateSourceFile(
        sf,
        [...createShimsStatements(sf), ...sf.statements],
        sf.isDeclarationFile,
        sf.referencedFiles,
        sf.typeReferenceDirectives,
        sf.hasNoDefaultLib,
        sf.libReferenceDirectives,
      );
      return ts.visitEachChild(sf, visit, context);
    };
  };
}

export function addShims(input: string, fileName: string, ext = ".js") {
  const sf = ts.createSourceFile(fileName, input, ts.ScriptTarget.ES2022);
  input = sf.statements
    .flatMap((statement) => {
      const newText = getNewImportLine(statement, sf, ext);
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
  const \_\_dirname=_halsp_cli_shims_path.dirname(_halsp_cli_shims_url.fileURLToPath(import.meta.url));`;
  if (input.includes("__dirname") && !input.includes("_halsp_cli_shims_path")) {
    input = dirnameCode + "\n" + input;
  }

  return input;
}

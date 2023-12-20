import ts from "typescript";

function createEsmShimsStatements(sf: ts.SourceFile) {
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

function createCjsShimsStatements(sf: ts.SourceFile) {
  const code = sf.getText();
  const nodes: ts.Statement[] = [];
  if (code.includes("_require")) {
    nodes.push(
      ts.factory.createVariableStatement(
        undefined,
        ts.factory.createVariableDeclarationList(
          [
            ts.factory.createVariableDeclaration(
              ts.factory.createIdentifier("_require"),
              undefined,
              undefined,
              ts.factory.createIdentifier("require"),
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
  esm: boolean,
): ts.TransformerFactory<ts.SourceFile> {
  return () => {
    return (sf) => {
      return ts.factory.updateSourceFile(
        sf,
        [
          ...(esm
            ? createEsmShimsStatements(sf)
            : createCjsShimsStatements(sf)),
          ...sf.statements,
        ],
        sf.isDeclarationFile,
        sf.referencedFiles,
        sf.typeReferenceDirectives,
        sf.hasNoDefaultLib,
        sf.libReferenceDirectives,
      );
    };
  };
}

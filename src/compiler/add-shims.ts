import ts from "typescript";

function isIdentifierExist(code: string, text: string) {
  function findIdentifer(node: ts.Node) {
    let exist = false;
    node.forEachChild((child) => {
      if (ts.isIdentifier(child) && child.escapedText == text) {
        exist = true;
      } else {
        const ex = findIdentifer(child);
        if (ex) exist = true;
      }
    });
    return exist;
  }

  const sf = ts.createSourceFile(".ts", code, ts.ScriptTarget.ES2022);
  return sf.statements.filter(findIdentifer).length > 0;
}

function createEsmShimsStatements(sf: ts.SourceFile) {
  const code = sf.getText();
  if (code.includes("_halsp_cli_shims_module")) return [];
  const nodes: ts.Statement[] = [];
  if (isIdentifierExist(code, "_require")) {
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
  if (isIdentifierExist(code, "_resolve")) {
    nodes.push(
      ts.factory.createVariableStatement(
        undefined,
        ts.factory.createVariableDeclarationList(
          [
            ts.factory.createVariableDeclaration(
              ts.factory.createIdentifier("_resolve"),
              undefined,
              undefined,
              ts.factory.createPropertyAccessExpression(
                ts.factory.createMetaProperty(
                  ts.SyntaxKind.ImportKeyword,
                  ts.factory.createIdentifier("meta"),
                ),
                ts.factory.createIdentifier("resolve"),
              ),
            ),
          ],
          ts.NodeFlags.Const,
        ),
      ),
    );
  }
  if (isIdentifierExist(code, "___dirname")) {
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
  if (isIdentifierExist(code, "_require")) {
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
  if (isIdentifierExist(code, "_resolve")) {
    nodes.push(
      ts.factory.createVariableStatement(
        undefined,
        ts.factory.createVariableDeclarationList(
          [
            ts.factory.createVariableDeclaration(
              ts.factory.createIdentifier("_resolve"),
              undefined,
              undefined,
              ts.factory.createArrowFunction(
                undefined,
                undefined,
                [
                  ts.factory.createParameterDeclaration(
                    undefined,
                    undefined,
                    ts.factory.createIdentifier("name"),
                    undefined,
                    undefined,
                    undefined,
                  ),
                  ts.factory.createParameterDeclaration(
                    undefined,
                    undefined,
                    ts.factory.createIdentifier("dir"),
                    undefined,
                    undefined,
                    undefined,
                  ),
                ],
                undefined,
                ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                ts.factory.createCallExpression(
                  ts.factory.createPropertyAccessExpression(
                    ts.factory.createIdentifier("require"),
                    ts.factory.createIdentifier("resolve"),
                  ),
                  undefined,
                  [
                    ts.factory.createIdentifier("name"),
                    ts.factory.createArrayLiteralExpression([
                      ts.factory.createIdentifier("dir"),
                    ]),
                  ],
                ),
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
  esm: boolean,
): ts.TransformerFactory<ts.SourceFile> {
  return () => {
    return (sf) => {
      const fileName = sf.fileName;
      let statements: ts.Statement[];
      if (fileName.match(/\.cts$/)) {
        statements = createCjsShimsStatements(sf);
      } else if (fileName.match(/\.mts$/)) {
        statements = createEsmShimsStatements(sf);
      } else {
        statements = esm
          ? createEsmShimsStatements(sf)
          : createCjsShimsStatements(sf);
      }
      return ts.factory.updateSourceFile(
        sf,
        [...statements, ...sf.statements],
        sf.isDeclarationFile,
        sf.referencedFiles,
        sf.typeReferenceDirectives,
        sf.hasNoDefaultLib,
        sf.libReferenceDirectives,
      );
    };
  };
}

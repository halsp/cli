import ts from "typescript";

export const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
  const visit: ts.Visitor = (node) => {
    if (ts.isImportDeclaration(node)) {
      const text = node.moduleSpecifier
        .getText()
        .replace(/^\'/, "")
        .replace(/^\"/, "")
        .replace(/\'$/, "")
        .replace(/\"$/, "");
      if (text.match(/^\..*$/) && !text.endsWith("js")) {
        // if (text == "../../configuration") {
        //   return node;
        // }
        return ts.factory.createImportDeclaration(
          node.modifiers,
          node.importClause,
          ts.factory.createStringLiteral(text + ".js"),
          node.attributes,
        );
      }
    }

    return ts.visitEachChild(node, visit, context);
  };

  return (node) => ts.visitEachChild(node, visit, context);
};

export default transformer;

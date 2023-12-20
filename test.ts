import ts from "typescript";

const sf = ts.createSourceFile(
  "1.test",
  "import type * as a from 'b'",
  ts.ScriptTarget.ES2022,
  false,
);
const statements = sf.statements;
const firstS = statements[0];
// console.log("sf", statements);
console.log("sf", ts.isImportDeclaration(firstS));
console.log("sf", ts.isTypeOnlyImportDeclaration(firstS));
console.log("sf", ts.isTypeOnlyImportOrExportDeclaration(firstS));
console.log("sf", firstS["isTypeOnly"]);

const firstC = firstS["importClause"];
console.log("sf", ts.isImportClause(firstC));
console.log("sf", ts.isTypeOnlyImportDeclaration(firstC));
console.log("sf", ts.isTypeOnlyImportOrExportDeclaration(firstC));
console.log("sf", firstC["isTypeOnly"]);

import { createRequire } from "./shims";
import type ts from "typescript";

const require = createRequire(import.meta.url);
const addJsExt = require("../../scripts/add-js-ext.cjs");
const addJsExtTransformer =
  addJsExt.addJsExtTransformer as ts.TransformerFactory<ts.SourceFile>;
export { addJsExtTransformer };

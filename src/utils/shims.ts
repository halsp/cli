import ts from "typescript";

const { createAddShimsTransformer: _createAddShimsTransformer } = _require(
  "../../scripts/add-shims.cjs",
);
const createAddShimsTransformer = _createAddShimsTransformer as (
  ext?: string,
) => ts.TransformerFactory<ts.SourceFile>;

export { createAddShimsTransformer };

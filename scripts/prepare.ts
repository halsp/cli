import path from "path";
import ts from "typescript";
import { createDirname } from "../src/utils/shims.js";
import transformer from "../src/utils/suffix-transformer.js";
import { rimraf } from "rimraf";

const dirname = createDirname(import.meta.url);
const tsConfigParseResult = ts.getParsedCommandLineOfConfigFile(
  path.join(dirname, "../tsconfig.json"),
  undefined,
  ts.sys as unknown as ts.ParseConfigFileHost,
)!;
const outDir = path.join(dirname, "../.cache-compiler");
tsConfigParseResult.options.outDir = outDir;
await rimraf(outDir + "/*", {
  glob: true,
});

const formatHost: ts.FormatDiagnosticsHost = {
  getCanonicalFileName: (path) => path,
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getNewLine: () => ts.sys.newLine,
};

const buildProgram = ts.createIncrementalProgram({
  rootNames: tsConfigParseResult.fileNames,
  projectReferences: tsConfigParseResult.projectReferences,
  options: tsConfigParseResult.options,
  configFileParsingDiagnostics: tsConfigParseResult.errors,
});
const program = buildProgram.getProgram();

const emitResult = buildProgram.emit(
  undefined,
  undefined,
  undefined,
  undefined,
  {
    after: [transformer],
  },
);

const diagnostics = ts
  .getPreEmitDiagnostics(program as unknown as ts.Program)
  .concat(emitResult.diagnostics);

if (diagnostics.length > 0) {
  console.error(
    ts.formatDiagnosticsWithColorAndContext(diagnostics, formatHost),
  );
  console.info(`Found ${diagnostics.length} error(s).` + ts.sys.newLine);
}

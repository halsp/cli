import { Inject } from "@sfajs/inject";
import ts from "typescript";
import { ConfigService } from "./config.service";
import { TsLoaderService } from "./ts-loader.service";
import { TsconfigService } from "./tsconfig.service";

export class CompilerService {
  @Inject
  private readonly tsconfigService!: TsconfigService;
  @Inject
  private readonly configService!: ConfigService;
  @Inject
  private readonly tsLoaderService!: TsLoaderService;

  private get tsBinary() {
    return this.tsLoaderService.tsBinary;
  }
  private get config() {
    return this.configService.value;
  }

  compiler() {
    const formatHost: ts.FormatDiagnosticsHost = {
      getCanonicalFileName: (path) => path,
      getCurrentDirectory: this.tsBinary.sys.getCurrentDirectory,
      getNewLine: () => this.tsBinary.sys.newLine,
    };
    const { options, fileNames, projectReferences } =
      this.tsconfigService.getParsedCommandLine();

    const createProgram =
      this.tsBinary.createIncrementalProgram || this.tsBinary.createProgram;
    const program = createProgram.call(ts, {
      rootNames: fileNames,
      projectReferences,
      options,
    });
    const programRef = program.getProgram
      ? program.getProgram()
      : (program as any as ts.Program);

    const before = this.config.build?.beforeHooks.map((hook) =>
      hook(programRef)
    );
    const after = this.config.build?.afterHooks.map((hook) => hook(programRef));
    const afterDeclarations = this.config.build?.afterDeclarationsHooks.map(
      (hook) => hook(programRef)
    );

    const emitResult = program.emit(
      undefined,
      undefined,
      undefined,
      undefined,
      {
        before,
        after,
        afterDeclarations,
      }
    );

    const errorsCount = this.reportAfterCompilationDiagnostic(
      program as any,
      emitResult,
      this.tsBinary,
      formatHost
    );
    if (errorsCount) {
      process.exit(1);
    }
    return !errorsCount;
  }

  private reportAfterCompilationDiagnostic(
    program: ts.EmitAndSemanticDiagnosticsBuilderProgram,
    emitResult: ts.EmitResult,
    tsBinary: typeof ts,
    formatHost: ts.FormatDiagnosticsHost
  ): number {
    const diagnostics = tsBinary
      .getPreEmitDiagnostics(program as unknown as ts.Program)
      .concat(emitResult.diagnostics);

    if (diagnostics.length > 0) {
      console.error(
        tsBinary.formatDiagnosticsWithColorAndContext(diagnostics, formatHost)
      );
      console.info(
        `Found ${diagnostics.length} error(s).` + tsBinary.sys.newLine
      );
    }
    return diagnostics.length;
  }
}

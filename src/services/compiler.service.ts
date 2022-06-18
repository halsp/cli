import { HttpContext, isUndefined } from "@sfajs/core";
import { Inject } from "@sfajs/inject";
import { Context } from "@sfajs/pipe";
import ts from "typescript";
import { ConfigService } from "./config.service";
import { TsconfigService } from "./tsconfig.service";

export class CompilerService {
  @Context
  private readonly ctx!: HttpContext;
  @Inject
  private readonly tsconfigService!: TsconfigService;
  @Inject
  private readonly configService!: ConfigService;

  private get config() {
    return this.configService.value;
  }
  public get sourceMap() {
    if (this.ctx.command == "start") {
      return true;
    }

    return this.configService.getOptionOrConfigValue<boolean, boolean>(
      "sourceMap",
      "build.sourceMap"
    );
  }

  compiler(outDir: string) {
    const formatHost: ts.FormatDiagnosticsHost = {
      getCanonicalFileName: (path) => path,
      getCurrentDirectory: ts.sys.getCurrentDirectory,
      getNewLine: () => ts.sys.newLine,
    };
    const { options, fileNames, projectReferences } =
      this.tsconfigService.parsedCommandLine;

    const createProgram = ts.createIncrementalProgram || ts.createProgram;
    const buildProgram = createProgram.call(ts, {
      rootNames: fileNames,
      projectReferences,
      options: this.getCompilerOptions(options, outDir),
    });
    const program = buildProgram.getProgram();

    const before =
      this.config.build?.beforeHooks?.map((hook) => hook(program)) ?? [];
    const after =
      this.config.build?.afterHooks?.map((hook) => hook(program)) ?? [];
    const afterDeclarations =
      this.config.build?.afterDeclarationsHooks?.map((hook) => hook(program)) ??
      [];

    const emitResult = buildProgram.emit(
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
      formatHost
    );
    if (errorsCount) {
      process.exit(1);
    }
    return !errorsCount;
  }

  private getCompilerOptions(options: ts.CompilerOptions, outDir: string) {
    const opts: Record<string, any> = {
      outDir,
    };
    if (!isUndefined(this.sourceMap)) {
      opts.sourceMap = this.sourceMap;
    }
    return Object.assign({}, options, opts);
  }

  private reportAfterCompilationDiagnostic(
    program: ts.EmitAndSemanticDiagnosticsBuilderProgram,
    emitResult: ts.EmitResult,
    formatHost: ts.FormatDiagnosticsHost
  ): number {
    const diagnostics = ts
      .getPreEmitDiagnostics(program as unknown as ts.Program)
      .concat(emitResult.diagnostics);

    if (diagnostics.length > 0) {
      console.error(
        ts.formatDiagnosticsWithColorAndContext(diagnostics, formatHost)
      );
      console.info(`Found ${diagnostics.length} error(s).` + ts.sys.newLine);
    }
    return diagnostics.length;
  }
}

import { Context, isUndefined } from "@halsp/core";
import { Inject } from "@halsp/inject";
import ts from "typescript";
import { ConfigService } from "./config.service";
import { TsconfigService } from "./tsconfig.service";
import { CompilerHook } from "../../configuration";
import { DepsService } from "../deps.service";
import { CommandService } from "../command.service";
import { addJsExtTransformer } from "../../utils/transformer";

export class CompilerService {
  @Inject
  private readonly ctx!: Context;
  @Inject
  private readonly tsconfigService!: TsconfigService;
  @Inject
  private readonly configService!: ConfigService;
  @Inject
  private readonly depsService!: DepsService;
  @Inject
  private readonly commandService!: CommandService;

  private get config() {
    return this.configService.value;
  }
  public get sourceMap() {
    if (this.ctx.command == "start") {
      return true;
    }

    return this.configService.getOptionOrConfigValue<boolean, boolean>(
      "sourceMap",
      "build.sourceMap",
    );
  }

  public async getHooks(program: ts.Program) {
    const before = [
      ...(await this.getPlugins<CompilerHook<ts.SourceFile>>("beforeCompile")),
      ...(this.config.build?.beforeHooks ?? []),
    ].map((hook) => hook(program));

    const after = [
      ...(await this.getPlugins<CompilerHook<ts.SourceFile>>("afterCompile")),
      ...(this.config.build?.afterHooks ?? []),
      ...(this.commandService.getOptionVlaue<boolean>("skipJsExtTransformer")
        ? []
        : [() => addJsExtTransformer]),
    ].map((hook) => hook(program));

    const afterDeclarations = [
      ...(await this.getPlugins<CompilerHook<ts.SourceFile | ts.Bundle>>(
        "afterCompileDeclarations",
      )),
      ...(this.config.build?.afterDeclarationsHooks ?? []),
    ].map((hook) => hook(program));

    return {
      before,
      after,
      afterDeclarations,
    };
  }

  private async getPlugins<
    T extends
      | CompilerHook<ts.SourceFile>
      | CompilerHook<ts.SourceFile | ts.Bundle>,
  >(name: string) {
    return await this.depsService.getInterfaces<T>(name);
  }

  public async compile(outDir: string) {
    const formatHost: ts.FormatDiagnosticsHost = {
      getCanonicalFileName: (path) => path,
      getCurrentDirectory: ts.sys.getCurrentDirectory,
      getNewLine: () => ts.sys.newLine,
    };
    const { options, fileNames, projectReferences } =
      this.tsconfigService.parsedCommandLine;

    const buildProgram = ts.createIncrementalProgram({
      rootNames: fileNames,
      projectReferences,
      options: this.getCompilerOptions(options, outDir),
    });

    const program = buildProgram.getProgram();
    const emitResult = buildProgram.emit(
      undefined,
      undefined,
      undefined,
      undefined,
      await this.getHooks(program),
    );

    const errorsCount = this.reportAfterCompilationDiagnostic(
      program as any,
      emitResult,
      formatHost,
    );
    return !errorsCount;
  }

  public getDefaultCompilerOptions(outDir: string) {
    const options: ts.CompilerOptions = {
      outDir,
      noEmitOnError: true,
    };
    if (!isUndefined(this.sourceMap)) {
      options.sourceMap = this.sourceMap;
    }
    return options;
  }

  private getCompilerOptions(options: ts.CompilerOptions, outDir: string) {
    const opts = this.getDefaultCompilerOptions(outDir);
    return Object.assign({}, options, opts);
  }

  private reportAfterCompilationDiagnostic(
    program: ts.EmitAndSemanticDiagnosticsBuilderProgram,
    emitResult: ts.EmitResult,
    formatHost: ts.FormatDiagnosticsHost,
  ): number {
    const diagnostics = ts
      .getPreEmitDiagnostics(program as unknown as ts.Program)
      .concat(emitResult.diagnostics);

    if (diagnostics.length > 0) {
      this.ctx.logger.error(
        ts.formatDiagnosticsWithColorAndContext(diagnostics, formatHost),
      );
      this.ctx.logger.info(
        `Found ${diagnostics.length} error(s).` + ts.sys.newLine,
      );
    }
    return diagnostics.length;
  }
}

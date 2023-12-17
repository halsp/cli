import { Context, isUndefined } from "@halsp/core";
import { Inject } from "@halsp/inject";
import ts from "typescript";
import { ConfigService } from "./config.service";
import { TsconfigService } from "./tsconfig.service";
import { CompilerHook } from "../../configuration";
import { DepsService } from "../deps.service";
import { createJsExtTransformer } from "../../utils/transformer";
import { FileService } from "../file.service";
import { createRequire } from "../../utils/shims";

const require = createRequire(import.meta.url);

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
  private readonly fileService!: FileService;

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

  private get moduleExt() {
    const ext = this.configService.getOptionOrConfigValue<string, string>(
      "moduleExt",
      "build.moduleExt",
    );
    if (!ext) return;

    const pkgPath = this.fileService.findFileFromTree("package.json");
    const isESM = !!pkgPath && require(pkgPath).type == "module";
    return isESM ? ".mjs" : ".cjs";
  }
  public get writeFileCallback() {
    const ext = this.moduleExt;

    return (
      path: string,
      data: string,
      writeByteOrderMark?: boolean | undefined,
    ) =>
      ts.sys.writeFile(
        ext ? path.replace(/\.js$/, ext) : path,
        data,
        writeByteOrderMark,
      );
  }

  public async getHooks(program: ts.Program) {
    const before = [
      ...(await this.getPlugins<CompilerHook<ts.SourceFile>>("beforeCompile")),
      ...(this.config.build?.beforeHooks ?? []),
    ].map((hook) => hook(program));

    const after = [
      () => createJsExtTransformer(this.moduleExt),
      ...(await this.getPlugins<CompilerHook<ts.SourceFile>>("afterCompile")),
      ...(this.config.build?.afterHooks ?? []),
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
      this.writeFileCallback,
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

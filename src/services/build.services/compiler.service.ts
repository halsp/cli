import { Context, isUndefined } from "@halsp/core";
import { Inject } from "@halsp/inject";
import ts from "typescript";
import { ConfigService } from "./config.service";
import { TsconfigService } from "./tsconfig.service";
import { CompilerHook } from "../../configuration";
import { DepsService } from "../deps.service";
import { addShimsTransformer } from "../../compiler";
import { createAddExtTransformer } from "../../compiler";
import { FileService } from "../file.service";

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
  public get moduleType() {
    const type = this.configService.getOptionOrConfigValue<string, string>(
      "moduleType",
      "build.moduleType",
    );
    if (type && type != "cjs" && type != "mjs") {
      throw new Enumerator(["cjs", "mjs"]);
    }
    return type as "cjs" | "mjs" | undefined;
  }
  private get isESM() {
    if (this.moduleType) {
      return this.moduleType == "mjs";
    }

    const pkgPath = this.fileService.findFileFromTree("package.json");
    return !!pkgPath && _require(pkgPath).type == "module";
  }
  public get writeFileCallback() {
    return (
      path: string,
      data: string,
      writeByteOrderMark?: boolean | undefined,
    ) =>
      ts.sys.writeFile(
        this.moduleType ? path.replace(/\.js$/, "." + this.moduleType) : path,
        data,
        writeByteOrderMark,
      );
  }
  private get esmTransformer(): CompilerHook<ts.SourceFile>[] {
    const result = [] as CompilerHook<ts.SourceFile>[];
    const ext = "." + (this.moduleType ? this.moduleType : "js");
    if (this.isESM) {
      result.push(() => addShimsTransformer);
      result.push(() => createAddExtTransformer(ext));
    } else if (this.moduleType) {
      result.push(() => createAddExtTransformer(ext));
    }
    return result;
  }

  public async getHooks(program: ts.Program) {
    const before = [
      ...(await this.getPlugins<CompilerHook<ts.SourceFile>>("beforeCompile")),
      ...(this.config.build?.beforeHooks ?? []),
    ].map((hook) => hook(program));

    const after = [
      ...this.esmTransformer,
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

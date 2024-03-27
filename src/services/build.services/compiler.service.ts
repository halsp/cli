import { Context, isUndefined } from "@halsp/core";
import { Inject } from "@halsp/inject";
import ts from "typescript";
import { ConfigService } from "./config.service";
import { TsconfigService } from "./tsconfig.service";
import { DepsService } from "../deps.service";
import {
  createAddExtTransformer,
  createAddShimsTransformer,
} from "../../compiler";
import { FileService } from "../file.service";
import { HALSP_CLI_PLUGIN_TRANSFORMER } from "../../constant";

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
    return this.configService.moduleType;
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

  public async getTransformers(
    program: ts.Program,
  ): Promise<ts.CustomTransformers> {
    const isESM = this.isESM;
    const ext = "." + (this.moduleType ? this.moduleType : "js");

    const configTransformers = await this.depsService.getInterfaces<
      (program: ts.Program) => ts.CustomTransformers
    >(HALSP_CLI_PLUGIN_TRANSFORMER);
    if (this.config.build?.transformers) {
      configTransformers.push(this.config.build.transformers);
    }
    const tsTransformers = configTransformers.map((t) => t(program));

    function readConfig<T extends keyof ts.CustomTransformers>(
      field: T,
    ): NonNullable<ts.CustomTransformers[T]> {
      return tsTransformers
        .map((t) => t[field] ?? [])
        .map((item) => item)
        .reduce((pre, cur) => {
          pre.push(...cur);
          return pre;
        }, [] as any[]);
    }

    const before = readConfig("before");
    const afterDeclarations = readConfig("afterDeclarations");
    const after = readConfig("after");

    if (!isESM && this.moduleType) {
      before.splice(0, 0, createAddExtTransformer(ext));
    }

    if (isESM) {
      after.splice(0, 0, createAddExtTransformer(ext));
    }
    after.splice(1, 0, createAddShimsTransformer(isESM));

    return {
      before,
      after,
      afterDeclarations,
    };
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
      await this.getTransformers(program),
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

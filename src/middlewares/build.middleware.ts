import { Middleware } from "@sfajs/core";
import { Inject } from "@sfajs/inject";
import path from "path";
import ts from "typescript";
import { AssetItem } from "../configuration";
import { ConfigService } from "../services/config.service";
import { FileService } from "../services/file.service";
import { TsLoaderService } from "../services/ts-loader.service";
import { TsconfigService } from "../services/tsconfig.service";

export class BuildMiddlware extends Middleware {
  @Inject
  private readonly tsconfigService!: TsconfigService;
  @Inject
  private readonly configService!: ConfigService;
  @Inject
  private readonly tsLoaderService!: TsLoaderService;
  @Inject
  private readonly fileService!: FileService;

  private get config() {
    return this.configService.value;
  }
  private get tsconfig() {
    return this.tsconfigService.value;
  }
  private get tsBinary() {
    return this.tsLoaderService.tsBinary;
  }

  async invoke(): Promise<void> {
    const outDir = this.tsconfig.compilerOptions?.outDir || "dist";
    if (this.config.build?.deleteOutDir) {
      this.fileService.deleteFile(path.join(process.cwd(), outDir));
    }

    const formatHost: ts.FormatDiagnosticsHost = {
      getCanonicalFileName: (path) => path,
      getCurrentDirectory: this.tsBinary.sys.getCurrentDirectory,
      getNewLine: () => this.tsBinary.sys.newLine,
    };
    const { options, fileNames, projectReferences } =
      this.tsBinary.getParsedCommandLineOfConfigFile(
        "",
        undefined!,
        this.tsBinary.sys as unknown as ts.ParseConfigFileHost
      ) as any;

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
    const success = !errorsCount;
    if (success) {
      if (this.config?.build?.deleteBuildFileTypes) {
        for (const type of this.config?.build?.deleteBuildFileTypes) {
          this.fileService.deleteFile(outDir, type);
        }
      }
      this.copyAssets(outDir);

      await this.next();
    }
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

  private copyAssets(outDir: string) {
    const files: AssetItem[] = [...(this.config.build?.assets ?? [])];
    files.forEach((asset) => {
      let source: string;
      let target: string;
      if (typeof asset == "string") {
        source = asset;
        target = asset;
      } else {
        source = asset.source;
        target = asset.target;
      }
      const sourcePath = path.join(process.cwd(), source);
      const targetPath = path.join(process.cwd(), outDir, target);
      this.fileService.copyFile(sourcePath, targetPath);
    });
  }
}

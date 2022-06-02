import { HttpContext } from "@sfajs/core";
import { Inject } from "@sfajs/inject";
import { Context } from "@sfajs/pipe";
import ts from "typescript";
import { ConfigService } from "./config.service";
import { TsLoaderService } from "./ts-loader.service";
import { TsconfigService } from "./tsconfig.service";

export class WatchCompilerService {
  @Context
  private readonly ctx!: HttpContext;
  @Inject
  private readonly tsconfigService!: TsconfigService;
  @Inject
  private readonly configService!: ConfigService;
  @Inject
  private readonly tsLoaderService!: TsLoaderService;

  private watcher?: ts.WatchOfConfigFile<ts.EmitAndSemanticDiagnosticsBuilderProgram>;

  private get tsBinary() {
    return this.tsLoaderService.tsBinary;
  }
  private get config() {
    return this.configService.value;
  }
  private get preserveWatchOutput() {
    return this.ctx.getCommandOption<boolean>("preserveWatchOutput") == true;
  }

  compiler(outDir: string, onSuccess?: () => void) {
    const tsCompilerOptions: ts.CompilerOptions = {
      outDir,
    };
    if (this.preserveWatchOutput) {
      tsCompilerOptions.preserveWatchOutput = true;
    }
    const { projectReferences } = this.tsconfigService.parsedCommandLine;

    const origDiagnosticReporter = (
      this.tsBinary as any
    ).createDiagnosticReporter(this.tsBinary.sys, true);
    const origWatchStatusReporter = (
      this.tsBinary as any
    ).createWatchStatusReporter(this.tsBinary.sys, true);
    const host = this.tsBinary.createWatchCompilerHost(
      this.tsconfigService.filePath,
      tsCompilerOptions,
      this.tsBinary.sys,
      this.tsBinary.createEmitAndSemanticDiagnosticsBuilderProgram,
      this.createDiagnosticReporter(origDiagnosticReporter),
      this.createWatchStatusChanged(origWatchStatusReporter, onSuccess)
    );

    const origCreateProgram = host.createProgram;
    host.createProgram = (
      rootNames: ReadonlyArray<string> | undefined,
      options: ts.CompilerOptions | undefined,
      host?: ts.CompilerHost,
      oldProgram?: ts.EmitAndSemanticDiagnosticsBuilderProgram
    ) => {
      const program = origCreateProgram.bind(this)(
        rootNames,
        options,
        host,
        oldProgram,
        undefined,
        projectReferences
      );

      const origProgramEmit = program.emit;
      program.emit = (
        targetSourceFile?: ts.SourceFile,
        writeFile?: ts.WriteFileCallback,
        cancellationToken?: ts.CancellationToken,
        emitOnlyDtsFiles?: boolean,
        customTransformers?: ts.CustomTransformers
      ) => {
        const transforms = customTransformers ?? {};

        const before =
          this.config.build?.beforeHooks?.map((hook) =>
            hook(program.getProgram())
          ) ?? [];
        const after =
          this.config.build?.afterHooks?.map((hook) =>
            hook(program.getProgram())
          ) ?? [];
        const afterDeclarations =
          this.config.build?.afterDeclarationsHooks?.map((hook) =>
            hook(program.getProgram())
          ) ?? [];

        transforms.before = before.concat(transforms.before || []);
        transforms.after = after.concat(transforms.after || []);
        transforms.afterDeclarations = afterDeclarations.concat(
          transforms.afterDeclarations || []
        );

        return origProgramEmit(
          targetSourceFile,
          writeFile,
          cancellationToken,
          emitOnlyDtsFiles,
          transforms
        );
      };
      return program;
    };

    this.watcher = this.tsBinary.createWatchProgram(host);
    return true;
  }

  stop() {
    this.watcher?.close();
    this.watcher = undefined;
  }

  private createDiagnosticReporter(
    diagnosticReporter: (diagnostic: ts.Diagnostic, ...args: any[]) => any
  ) {
    return function (this: any, diagnostic: ts.Diagnostic, ...args: any[]) {
      return diagnosticReporter.call(this, diagnostic, ...args);
    };
  }

  private createWatchStatusChanged(
    watchStatusReporter: (diagnostic: ts.Diagnostic, ...args: any[]) => any,
    onSuccess?: () => void
  ) {
    return function (this: any, diagnostic: ts.Diagnostic, ...args: any[]) {
      const messageText = diagnostic && diagnostic.messageText;
      const noErrorsMessage = "0 errors";
      if (
        messageText &&
        (messageText as string).includes &&
        (messageText as string).includes(noErrorsMessage) &&
        onSuccess
      ) {
        onSuccess();
      }
      return watchStatusReporter.call(this, diagnostic, ...args);
    };
  }
}

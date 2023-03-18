import { isUndefined } from "@halsp/core";
import { Inject } from "@halsp/inject";
import ts from "typescript";
import { CompilerService } from "./compiler.service";
import { ConfigService } from "./config.service";
import { TsconfigService } from "./tsconfig.service";

export class WatchCompilerService {
  @Inject
  private readonly tsconfigService!: TsconfigService;
  @Inject
  private readonly configService!: ConfigService;
  @Inject
  private readonly compilerService!: CompilerService;

  private watcher?: ts.WatchOfConfigFile<ts.EmitAndSemanticDiagnosticsBuilderProgram>;

  private get preserveWatchOutput() {
    return this.configService.getOptionOrConfigValue<boolean, boolean>(
      "preserveWatchOutput",
      "build.preserveWatchOutput"
    );
  }

  compile(outDir: string, onSuccess?: () => void) {
    const { projectReferences, fileNames, options } =
      this.tsconfigService.parsedCommandLine;

    const origDiagnosticReporter = (ts as any).createDiagnosticReporter(
      ts.sys,
      true
    );
    const origWatchStatusReporter = (ts as any).createWatchStatusReporter(
      ts.sys,
      true
    );

    const host = ts.createWatchCompilerHost(
      fileNames,
      this.getCompilerOptions(options, outDir),
      ts.sys,
      ts.createEmitAndSemanticDiagnosticsBuilderProgram,
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
        const transforms = Object.assign(
          customTransformers ?? {},
          this.compilerService.getHooks(program.getProgram())
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

    this.watcher = ts.createWatchProgram(host);
    return true;
  }

  stop() {
    this.watcher?.close();
    this.watcher = undefined;
  }

  private getCompilerOptions(options: ts.CompilerOptions, outDir: string) {
    const opts = this.compilerService.getDefaultCompilerOptions(outDir);

    if (!isUndefined(this.preserveWatchOutput)) {
      opts.preserveWatchOutput = this.preserveWatchOutput;
    }
    return Object.assign({}, options, opts);
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

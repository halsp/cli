import ts from "typescript";
import * as fs from "fs";
import path from "path";
import { Inject } from "@sfajs/inject";
import { CommandService } from "./command.service";

export class TsconfigService {
  @Inject
  private readonly commandService!: CommandService;

  private get fileName() {
    return this.commandService.getOptionVlaue<string>(
      "tsconfigPath",
      "tsconfig.json"
    );
  }
  private get filePath() {
    return path.resolve(process.cwd(), this.fileName);
  }
  get cacheDir() {
    return ".sfa-cache";
  }
  get outDir() {
    return this.parsedCommandLine.options.outDir || "dist";
  }

  #parsedCommandLine: ts.ParsedCommandLine | undefined = undefined;
  public get parsedCommandLine(): ts.ParsedCommandLine {
    if (this.#parsedCommandLine == undefined) {
      this.#parsedCommandLine = this.getParsedCommandLine();
    }
    return this.#parsedCommandLine;
  }

  public getParsedCommandLine(
    optionsToExtend?: ts.CompilerOptions,
    extendedConfigCache?: ts.ESMap<string, ts.ExtendedConfigCacheEntry>,
    watchOptionsToExtend?: ts.WatchOptions,
    extraFileExtensions?: readonly ts.FileExtensionInfo[]
  ) {
    this.ensureTsconfigFile();

    const parsedCmd = ts.getParsedCommandLineOfConfigFile(
      this.filePath,
      optionsToExtend,
      ts.sys as unknown as ts.ParseConfigFileHost,
      extendedConfigCache,
      watchOptionsToExtend,
      extraFileExtensions
    );
    if (!parsedCmd) {
      throw new Error("failed");
    }
    return parsedCmd;
  }

  private ensureTsconfigFile() {
    if (!fs.existsSync(this.filePath)) {
      throw new Error(
        `Could not find TypeScript configuration file ${this.fileName}`
      );
    }
  }
}

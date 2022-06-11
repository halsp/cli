import * as ts from "typescript";
import * as fs from "fs";
import { Context } from "@sfajs/pipe";
import { HttpContext } from "@sfajs/core";
import path from "path";
import { Inject } from "@sfajs/inject";
import { TsLoaderService } from "./ts-loader.service";
import { CommandService } from "./command.service";

export class TsconfigService {
  @Context
  private readonly ctx!: HttpContext;
  @Inject
  private readonly tsLoaderService!: TsLoaderService;
  @Inject
  private readonly commandService!: CommandService;

  get fileName() {
    return (
      this.commandService.getOptionVlaue<string>("tsconfigFile") ??
      "tsconfig.json"
    );
  }
  get filePath() {
    return path.resolve(process.cwd(), this.fileName);
  }
  get cacheDir() {
    return ".sfa-cache";
  }
  get outDir() {
    return this.value.compilerOptions?.outDir || "dist";
  }
  private get tsBinary() {
    return this.tsLoaderService.tsBinary;
  }

  #value: ts.TranspileOptions | undefined = undefined;
  get value(): ts.TranspileOptions {
    if (this.#value == undefined) {
      this.ensureTsconfigFile();

      const text = fs.readFileSync(this.filePath, "utf-8");
      this.#value = JSON.parse(text) as ts.TranspileOptions;
    }
    return this.#value;
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

    const parsedCmd = this.tsBinary.getParsedCommandLineOfConfigFile(
      this.filePath,
      optionsToExtend,
      this.tsBinary.sys as unknown as ts.ParseConfigFileHost,
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

import ts from "typescript";
import * as fs from "fs";
import { Context } from "@sfajs/pipe";
import { HttpContext } from "@sfajs/core";
import path from "path";
import { Inject } from "@sfajs/inject";
import { TsLoaderService } from "./ts-loader.service";

export class TsconfigService {
  @Context
  private readonly ctx!: HttpContext;
  @Inject
  private readonly tsLoaderService!: TsLoaderService;

  get fileName() {
    return this.ctx.getCommandOption<string>("tsconfigFile") ?? "tsconfig.json";
  }
  get filePath() {
    return path.resolve(process.cwd(), this.fileName);
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

  getParsedCommandLine() {
    this.ensureTsconfigFile();

    const parsedCmd = this.tsBinary.getParsedCommandLineOfConfigFile(
      this.filePath,
      undefined,
      this.tsBinary.sys as unknown as ts.ParseConfigFileHost
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

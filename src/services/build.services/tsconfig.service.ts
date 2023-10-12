import ts from "typescript";
import * as fs from "fs";
import path from "path";
import { Inject } from "@halsp/inject";
import { CommandService } from "../command.service";

export class TsconfigService {
  @Inject
  private readonly commandService!: CommandService;

  private get fileName() {
    return this.commandService.getOptionVlaue<string>(
      "tsconfigPath",
      "tsconfig.json",
    );
  }
  public get filePath() {
    return path.resolve(process.cwd(), this.fileName);
  }
  public get outDir() {
    return this.parsedCommandLine.options.outDir || "dist";
  }

  #parsedCommandLine: ts.ParsedCommandLine | undefined = undefined;
  public get parsedCommandLine(): ts.ParsedCommandLine {
    if (this.#parsedCommandLine == undefined) {
      this.#parsedCommandLine = this.getParsedCommandLine();
    }
    return this.#parsedCommandLine;
  }

  private getParsedCommandLine() {
    this.ensureTsconfigFile();

    const parsedCmd = ts.getParsedCommandLineOfConfigFile(
      this.filePath,
      undefined,
      ts.sys as unknown as ts.ParseConfigFileHost,
    );
    return parsedCmd!;
  }

  private ensureTsconfigFile() {
    if (!fs.existsSync(this.filePath)) {
      throw new Error(
        `Could not find TypeScript configuration file ${this.fileName}`,
      );
    }
  }
}

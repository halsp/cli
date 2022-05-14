import ts from "typescript";
import * as fs from "fs";
import { Context } from "@sfajs/pipe";
import { HttpContext } from "@sfajs/core";
import path from "path";

export class TsconfigService {
  @Context
  private readonly ctx!: HttpContext;

  get fileName() {
    return this.ctx.commandArgs.tsconfigFile ?? "tsconfig.json";
  }

  get filePath() {
    return path.resolve(process.cwd(), this.fileName);
  }

  #value: ts.TranspileOptions | undefined = undefined;
  get value(): ts.TranspileOptions {
    if (this.#value == undefined) {
      if (!fs.existsSync(this.filePath)) {
        throw new Error(
          `Could not find TypeScript configuration file ${this.fileName}`
        );
      }

      const text = fs.readFileSync(this.filePath, "utf-8");
      this.#value = JSON.parse(text) as ts.TranspileOptions;
    }
    return this.#value;
  }
}

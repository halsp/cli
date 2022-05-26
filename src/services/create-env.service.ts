import { HttpContext } from "@sfajs/core";
import inquirer from "inquirer";
import * as fs from "fs";
import path from "path";
import { Inject } from "@sfajs/inject";
import { FileService } from "./file.service";
import { Context } from "@sfajs/pipe";

const commentEnvStartRegExp = /^\s*\/{2,}\s+/;
const commentEnvLineRegExp = /^\s*\/{2,}\s+.+/;

export class CreateEnvService {
  @Context
  private readonly ctx!: HttpContext;
  @Inject
  private readonly fileService!: FileService;

  public get templateEnvDir() {
    return path.join(__dirname, `../../template/env`);
  }
  private get name() {
    return this.ctx.commandArgs.name;
  }
  public get targetDir() {
    return path.join(process.cwd(), this.name);
  }

  public async create() {
    const env = await this.getEnv();
    const sourceFilePath = path.join(this.templateEnvDir, `${env}.ts`);
    const targetFilePath = path.join(this.targetDir, `src/index.ts`);

    if (fs.existsSync(targetFilePath)) {
      const message = `The environment file already exists. Overwrite?`;
      if (!(await this.fileService.isOverwrite(message))) {
        return;
      }
    }

    const code = fs
      .readFileSync(sourceFilePath, "utf-8")
      .replace(commentEnvLineRegExp, "")
      .trimStart();
    fs.writeFileSync(targetFilePath, code);
  }

  private async getEnv(): Promise<string> {
    const envs = fs
      .readdirSync(this.templateEnvDir)
      .filter((file) => !file.endsWith("startup.ts"))
      .filter((file) => {
        const stat = fs.statSync(path.join(this.templateEnvDir, file));
        return stat.isFile();
      })
      .map((file) => {
        const filePath = path.join(this.templateEnvDir, file);
        const name = fs
          .readFileSync(filePath, "utf-8")
          .replace(/\r\n/g, "\n")
          .split("\n")
          .filter((line) => commentEnvStartRegExp.test(line))[0]
          .replace(commentEnvStartRegExp, "");
        const env = file.replace(/\.ts$/, "");
        return {
          name,
          value: env,
        };
      });

    const { env } = await inquirer.prompt([
      {
        type: "list",
        message: "Select environment",
        name: "env",
        default: "http",
        choices: envs,
      },
    ]);
    return env;
  }
}
import { HttpContext } from "@sfajs/core";
import inquirer from "inquirer";
import * as fs from "fs";
import path from "path";
import { Inject } from "@sfajs/inject";
import { FileService } from "./file.service";
import { Context } from "@sfajs/pipe";
import { Env } from "../utils/plugins";
import { CommandService } from "./command.service";

const commentEnvStartRegExp = /^\s*\/{2,}\s+/;
const commentEnvLineRegExp = /^\s*\/{2,}\s+.+/;

export class CreateEnvService {
  @Context
  private readonly ctx!: HttpContext;
  @Inject
  private readonly fileService!: FileService;
  @Inject
  private readonly commandService!: CommandService;

  private get name() {
    return this.ctx.commandArgs.name;
  }
  public get sourceDir() {
    return path.join(__dirname, `../../env`);
  }
  public get targetDir() {
    return path.join(process.cwd(), this.name);
  }

  public async create(): Promise<Env | undefined> {
    const env = await this.getEnv();
    const sourceFilePath = path.join(this.sourceDir, `${env}.ts`);
    const targetFilePath = path.join(this.targetDir, `src/index.ts`);

    await this.fileService.createDir(targetFilePath);

    const code = fs
      .readFileSync(sourceFilePath, "utf-8")
      .replace(commentEnvLineRegExp, "")
      .trimStart();
    await fs.promises.writeFile(targetFilePath, code);
    return env;
  }

  private async getEnv(): Promise<Env | undefined> {
    if (this.commandService.getOptionVlaue<boolean>("skip-env")) {
      return undefined;
    }

    let env: Env;
    const envs = await this.getExistEnvs();
    env = this.commandService.getOptionVlaue<string>("env") as Env;
    if (env && !envs.some((e) => e.value == env)) {
      throw new Error("The env is not exist");
    }
    if (!env) {
      env = await this.getEnvByInquirer(envs);
    }
    return env;
  }

  private async getExistEnvs() {
    return (await fs.promises.readdir(this.sourceDir))
      .filter((file) => file.endsWith(".ts"))
      .filter((file) => !file.endsWith("startup.ts"))
      .filter((file) => {
        const stat = fs.statSync(path.join(this.sourceDir, file));
        return stat.isFile();
      })
      .map((file) => {
        const filePath = path.join(this.sourceDir, file);
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
  }

  private async getEnvByInquirer(
    envs: { name: string; value: string }[]
  ): Promise<Env> {
    const { env } = await inquirer.prompt([
      {
        type: "list",
        message: "Pick the environment to run application:",
        name: "env",
        default: "http",
        choices: envs,
      },
    ]);
    return env;
  }
}

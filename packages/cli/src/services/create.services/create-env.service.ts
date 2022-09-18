import { HttpContext } from "@ipare/core";
import inquirer from "inquirer";
import * as fs from "fs";
import path from "path";
import { Inject } from "@ipare/inject";
import { FileService } from "../file.service";
import { Context } from "@ipare/pipe";
import { EnvPlugin, EnvType } from "../../utils/plugins";
import { CommandService } from "../command.service";

const commentEnvLineRegExp = /^\s*\/{2,}\s+(\d+)\.(.+)/;
const commentUseEnvLineRegExp = /^\s*\/{2,}\s+use\s(.+)/;

type EnvConfig = {
  desc: string;
  type: EnvType;
  plugin: EnvPlugin;
};

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
    return path.join(__dirname, `../../../env`);
  }
  public get targetDir() {
    return path.join(process.cwd(), this.name);
  }

  public async create(): Promise<EnvPlugin | undefined> {
    const env = await this.getEnv();
    if (!env) return;

    const sourceFilePath = path.join(this.sourceDir, `${env.type}.ts`);
    const targetFilePath = path.join(this.targetDir, `src/index.ts`);

    await this.fileService.createDir(targetFilePath);

    const code = fs
      .readFileSync(sourceFilePath, "utf-8")
      .replace(commentEnvLineRegExp, "")
      .replace(commentUseEnvLineRegExp, "")
      .trimStart();
    await fs.promises.writeFile(targetFilePath, code);
    return env.plugin;
  }

  private async getEnv(): Promise<EnvConfig | undefined> {
    if (this.commandService.getOptionVlaue<boolean>("skipEnv")) {
      return undefined;
    }

    let envType: EnvType;
    const envs = await this.getExistEnvs();
    envType = this.commandService.getOptionVlaue<string>("env") as EnvType;
    if (envType && !envs.some((e) => e.type == envType)) {
      throw new Error("The env is not exist");
    }
    if (!envType) {
      envType = await this.getEnvByInquirer(envs);
    }
    return envs.filter((e) => e.type == envType)[0];
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
        const lines = fs
          .readFileSync(filePath, "utf-8")
          .replace(/\r\n/g, "\n")
          .split("\n");
        const execArr = lines
          .filter((line) => commentEnvLineRegExp.test(line))[0]
          .match(commentEnvLineRegExp) as RegExpExecArray;

        const useEnvExec = lines
          .filter((line) => commentUseEnvLineRegExp.test(line))[0]
          ?.match(commentUseEnvLineRegExp);

        return {
          order: Number(execArr[1]),
          desc: execArr[2],
          type: file.replace(/\.ts$/, ""),
          plugin: useEnvExec ? useEnvExec[1] : file.replace(/\.ts$/, ""),
        } as EnvConfig & { order: number };
      })
      .sort((a, b) => a.order - b.order);
  }

  private async getEnvByInquirer(envs: EnvConfig[]): Promise<EnvType> {
    const { env } = await inquirer.prompt([
      {
        type: "list",
        message: "Pick the environment to run application:",
        name: "env",
        default: "http",
        choices: envs.map((item) => ({
          name: `${item.desc} (@ipare/${item.plugin})`,
          value: item.type,
        })),
      },
    ]);
    return env;
  }
}

import { Context } from "@ipare/core";
import inquirer from "inquirer";
import * as fs from "fs";
import path from "path";
import { Inject } from "@ipare/inject";
import { FileService } from "../file.service";
import { InjectContext } from "@ipare/pipe";
import { CommandService } from "../command.service";

type EnvConfigItem = {
  desc: string;
  file: string;
  plugin: string;
};
type EnvConfigType = {
  desc: string;
  children: EnvConfigItem[];
  pickMessage: string;
};

type EnvConfig = EnvConfigItem | EnvConfigType;

export class CreateEnvService {
  @InjectContext
  private readonly ctx!: Context;
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

  public async create(): Promise<string | undefined> {
    const env = await this.getEnv();
    if (!env) return;

    const sourceFilePath = path.join(this.sourceDir, `${env.file}.ts`);
    const targetFilePath = path.join(this.targetDir, `src/index.ts`);

    await this.fileService.createDir(targetFilePath);
    await fs.promises.copyFile(sourceFilePath, targetFilePath);
    return env.plugin;
  }

  private async getEnv(): Promise<EnvConfigItem | undefined> {
    if (this.commandService.getOptionVlaue<boolean>("skipEnv")) {
      return undefined;
    }

    let envType: string;
    const envConfig = this.getEnvConfig();
    const envs = this.getEnvs(envConfig);
    envType = this.commandService.getOptionVlaue<string>("env") as string;
    if (envType && !this.getEnvs(envConfig).some((e) => e.file == envType)) {
      throw new Error("The env is not exist");
    }
    if (!envType) {
      envType = await this.getEnvByInquirer(envConfig);
    }
    return envs.filter((e) => e.file == envType)[0];
  }

  private getEnvConfig(): EnvConfig[] {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(path.join(this.sourceDir, "config.json"));
  }

  private getEnvs(config: EnvConfig[]) {
    const result: EnvConfigItem[] = [];

    config
      .filter((item) => "file" in item)
      .forEach((item) => result.push(item as EnvConfigItem));

    config
      .filter((item) => "children" in item)
      .forEach((item) => {
        (item as EnvConfigType).children.forEach((item) => result.push(item));
      });

    return result;
  }

  private async getEnvByInquirer(
    envConfig: EnvConfig[],
    message?: string
  ): Promise<string> {
    message = message ?? "Pick the environment to run application";
    const answer = await inquirer.prompt([
      {
        type: "list",
        message: message,
        name: "env",
        default: envConfig[0],
        choices: envConfig.map((item) => ({
          name:
            "file" in item
              ? `${item.desc} (@ipare/${item.plugin})`
              : `${item.desc} ->`,
          value: item,
        })),
      },
    ]);
    const env = answer.env as EnvConfig;
    if ("file" in env) {
      return env.file;
    } else {
      return await this.getEnvByInquirer(env.children, env.pickMessage);
    }
  }
}

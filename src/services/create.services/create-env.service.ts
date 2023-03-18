import { Context } from "@halsp/core";
import inquirer from "inquirer";
import * as fs from "fs";
import path from "path";
import { Inject } from "@halsp/inject";
import { FileService } from "../file.service";
import { Ctx } from "@halsp/pipe";
import { CommandService } from "../command.service";
import {
  EnvPluginItem,
  EnvSelectItem,
  PluginConfigService,
} from "./plugin-config.service";

export class CreateEnvService {
  @Ctx
  private readonly ctx!: Context;
  @Inject
  private readonly fileService!: FileService;
  @Inject
  private readonly commandService!: CommandService;
  @Inject
  private readonly pluginConfigService!: PluginConfigService;

  private get name() {
    return this.ctx.commandArgs.name;
  }
  public get sourceDir() {
    return path.join(__dirname, `../../../template/startups`);
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

  private async getEnv(): Promise<EnvPluginItem | undefined> {
    if (this.commandService.getOptionVlaue<boolean>("skipEnv")) {
      return undefined;
    }

    let envType: string;
    const { envs: envConfig } = await this.pluginConfigService.getConfig();
    const envs = this.getEnvs(envConfig);
    envType = this.commandService.getOptionVlaue<string>("env") as string;
    if (envType && !envs.some((e) => e.file == envType)) {
      throw new Error("The env is not exist");
    }
    if (!envType) {
      envType = await this.getEnvByInquirer(envConfig);
    }
    return envs.filter((e) => e.file == envType)[0];
  }

  private getEnvs(config: EnvSelectItem[]) {
    const result: EnvPluginItem[] = [];

    function add(items: EnvSelectItem[]) {
      items.forEach((item) => {
        if ("children" in item) {
          add(item.children);
        } else {
          result.push(item);
        }
      });
    }

    add(config);

    return result;
  }

  private async getEnvByInquirer(
    envConfig: EnvSelectItem[],
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
              ? `${item.desc} (@halsp/${item.plugin})`
              : `${item.desc} ->`,
          value: item,
        })),
      },
    ]);
    const env = answer.env as EnvSelectItem;
    if ("file" in env) {
      return env.file;
    } else {
      return await this.getEnvByInquirer(env.children, env.pickMessage);
    }
  }
}

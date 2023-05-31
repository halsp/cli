import { Inject } from "@halsp/inject";
import { CommandService } from "../command.service";
import {
  EnvPluginItem,
  EnvSelectItem,
  PluginConfigService,
} from "./plugin-config.service";
import { InquirerService } from "../inquirer.service";

export class EnvService {
  @Inject
  private readonly commandService!: CommandService;
  @Inject
  private readonly pluginConfigService!: PluginConfigService;
  @Inject
  private readonly inquirerService!: InquirerService;

  public async getEnv(): Promise<EnvPluginItem | undefined> {
    if (this.commandService.getOptionVlaue<boolean>("skipEnv")) {
      return undefined;
    }

    let envType: string;
    const { envs: envConfig } = await this.pluginConfigService.getConfig();
    const envs = this.getEnvs(envConfig);
    envType = this.commandService.getOptionVlaue<string>("env") as string;
    if (envType && !envs.some((e) => e.flag == envType)) {
      throw new Error("The env is not exist");
    }
    if (!envType) {
      envType = await this.getEnvByInquirer(envConfig);
    }
    return envs.filter((e) => e.flag == envType)[0];
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
    const answer = await this.inquirerService.prompt([
      {
        type: "list",
        message: message,
        name: "env",
        default: envConfig[0],
        choices: envConfig.map((item) => ({
          name:
            "flag" in item
              ? `${item.desc} (@halsp/${item.plugin})`
              : `${item.desc} ->`,
          value: item,
        })),
      },
    ]);
    const env = answer.env as EnvSelectItem;
    if ("flag" in env) {
      return env.flag;
    } else {
      return await this.getEnvByInquirer(env.children, env.pickMessage);
    }
  }
}

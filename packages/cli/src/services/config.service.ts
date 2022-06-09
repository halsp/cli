import { Context } from "@sfajs/pipe";
import { HttpContext } from "@sfajs/core";
import path from "path";
import { Configuration, ConfigEnv } from "../configuration";
import { Inject } from "@sfajs/inject";
import { ReadService } from "./read.service";

export class ConfigService {
  @Context
  private readonly ctx!: HttpContext;
  @Inject
  private readonly readService!: ReadService;

  #configFileName: string | undefined = undefined;
  get configFileName() {
    if (this.#configFileName == undefined) {
      const optionsConfigName = this.ctx.getCommandOption<string>("configName");
      if (optionsConfigName) {
        this.#configFileName = optionsConfigName;
      } else {
        this.#configFileName =
          this.readService.existAny([
            "sfa-cli.config.ts",
            "sfacli.config.ts",
            "sfa-cli.ts",
            "sfacli.ts",
          ]) ?? "";
      }
    }
    return this.#configFileName;
  }

  get configFilePath() {
    if (this.configFileName) {
      return path.resolve(process.cwd(), this.configFileName);
    } else {
      return "";
    }
  }

  public get mode() {
    return this.ctx.getCommandOption<string>("mode") ?? "production";
  }

  #value: Configuration | undefined = undefined;
  get value(): Configuration {
    return this.#value ?? {};
  }

  public async init() {
    if (!this.#value) {
      this.#value = await this.loadConfig();
    }
  }

  private async loadConfig(): Promise<Configuration> {
    if (!this.configFilePath) {
      return {};
    }

    const registerer = await this.registerTsNode();
    registerer.enabled(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const module = require(this.configFilePath);
      const configOptions: ConfigEnv = {
        mode: this.mode,
        dirname: path.dirname(this.configFilePath),
        command: this.ctx.command,
      };
      if (typeof module == "function") {
        return module(configOptions);
      } else if (module.default) {
        return module.default(configOptions);
      } else {
        return {};
      }
    } finally {
      registerer.enabled(false);
    }
  }

  private async registerTsNode() {
    try {
      const tsNode = await import("ts-node");
      return tsNode.register({
        compilerOptions: {
          module: "CommonJS",
        },
        moduleTypes: {
          "**": "cjs",
        },
      });
    } catch (e: any) {
      if (e.code === "ERR_MODULE_NOT_FOUND") {
        throw new Error(
          `Jest: 'ts-node' is required for the TypeScript configuration files. Make sure it is installed\nError: ${e.message}`
        );
      }
      throw e;
    }
  }
}

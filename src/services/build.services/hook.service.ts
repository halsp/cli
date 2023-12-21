import { Inject } from "@halsp/inject";
import { ConfigService } from "./config.service";
import { Context } from "@halsp/core";
import { DepsService } from "../deps.service";
import { Prebuild } from "../../configuration";
import {
  HALSP_CLI_PLUGIN_PREBUILD,
  HALSP_CLI_PLUGIN_POSTBUILD,
} from "../../constant";

export class HookService {
  @Inject
  private readonly configService!: ConfigService;
  @Inject
  private readonly ctx!: Context;
  @Inject
  private readonly depsService!: DepsService;

  private get config() {
    return this.configService.value;
  }

  private get cacheDir() {
    return this.configService.cacheDir;
  }

  public async execPrebuilds(): Promise<boolean> {
    const pluginPrebuild = await this.getHooks(HALSP_CLI_PLUGIN_PREBUILD);
    if (this.config.build?.prebuild) {
      pluginPrebuild.push(...this.config.build.prebuild);
    }
    const options = this.getScriptOptions();

    for (const fn of pluginPrebuild) {
      if ((await fn(options)) == false) {
        return false;
      }
    }
    return true;
  }

  public async execPostbuilds() {
    const pluginPostbuild = await this.getHooks(HALSP_CLI_PLUGIN_POSTBUILD);
    if (this.config.build?.postbuild) {
      pluginPostbuild.push(...this.config.build.postbuild);
    }
    const options = this.getScriptOptions();

    for (const fn of pluginPostbuild) {
      await fn(options);
    }
  }

  private getScriptOptions() {
    return {
      config: this.config,
      command: this.ctx.command,
      cacheDir: this.cacheDir,
      mode: this.configService.mode,
      commandArgs: { ...this.ctx.commandArgs },
      commandOptions: { ...this.ctx.commandOptions },
    };
  }

  private getHooks(name: string) {
    return this.depsService.getInterfaces<Prebuild>(name);
  }
}

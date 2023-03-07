import { Inject } from "@halsp/inject";
import { ConfigService } from "./config.service";
import { PluginInterfaceService } from "./plugin-interface.service";
import { Ctx } from "@halsp/pipe";
import { Context } from "@halsp/common";

export class HookService {
  @Inject
  private readonly pluginInterfaceService!: PluginInterfaceService;
  @Inject
  private readonly configService!: ConfigService;

  @Ctx
  private readonly ctx!: Context;

  private get config() {
    return this.configService.value;
  }

  private get cacheDir() {
    return this.configService.cacheDir;
  }

  public async execPrebuilds(): Promise<boolean> {
    const internalPrebuild = this.pluginInterfaceService.get("prebuild");
    const options = this.getScriptOptions();

    for (const fn of [
      ...internalPrebuild,
      ...(this.config.build?.prebuild ?? []),
    ]) {
      if ((await fn(options)) == false) {
        return false;
      }
    }
    return true;
  }

  public async execPostbuilds() {
    const internalPostbuild = this.pluginInterfaceService.get("postbuild");
    const options = this.getScriptOptions();

    for (const fn of [
      ...internalPostbuild,
      ...(this.config.build?.postbuild ?? []),
    ]) {
      await fn(options);
    }
  }

  private getScriptOptions() {
    return {
      config: this.config,
      command: this.ctx.command,
      cacheDir: this.cacheDir,
      mode: this.configService.mode,
    };
  }
}

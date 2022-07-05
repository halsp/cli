import { Inject } from "@sfajs/inject";
import { CommandType } from "../configuration";
import { ConfigService } from "./config.service";
import { TsconfigService } from "./tsconfig.service";
import { PluginInterfaceService } from "./plugin-interface.service";

export class HookService {
  @Inject
  private readonly pluginInterfaceService!: PluginInterfaceService;
  @Inject
  private readonly configService!: ConfigService;
  @Inject
  private readonly tsconfigService!: TsconfigService;

  private get config() {
    return this.configService.value;
  }

  private get cacheDir() {
    return this.tsconfigService.cacheDir;
  }

  public async execPrebuilds(command: CommandType): Promise<boolean> {
    const internalPrebuild = this.pluginInterfaceService.get("prebuild");
    const options = this.getScriptOptions(command);

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

  public async execPostbuilds(command: CommandType) {
    const internalPostbuild = this.pluginInterfaceService.get("postbuild");
    const options = this.getScriptOptions(command);

    for (const fn of [
      ...internalPostbuild,
      ...(this.config.build?.postbuild ?? []),
    ]) {
      await fn(options);
    }
  }

  private getScriptOptions(command: CommandType) {
    return {
      config: this.config,
      command: command,
      cacheDir: this.cacheDir,
      mode: this.configService.mode,
    };
  }
}

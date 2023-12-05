import { Inject } from "@halsp/inject";
import { ConfigService } from "./config.service";
import { Context } from "@halsp/core";
import { DepsService } from "../deps.service";
import { Prebuild } from "../../configuration";

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
    const internalPrebuild = this.getHooks("prebuild");
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
    const internalPostbuild = this.getHooks("postbuild");
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

  private getHooks(name: string) {
    return this.depsService
      .getInterfaces<Prebuild>(name)
      .map((item) => item.interface);
  }
}

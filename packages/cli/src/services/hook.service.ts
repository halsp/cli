import { Inject } from "@sfajs/inject";
import path from "path";
import {
  CommandType,
  CompilerHook,
  Postbuild,
  Prebuild,
} from "../configuration";
import { DepsService } from "./deps.service";
import * as fs from "fs";
import { ConfigService } from "./config.service";
import { TsconfigService } from "./tsconfig.service";

export class HookService {
  @Inject
  private readonly depsService!: DepsService;
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

  public getPluginHooks(name: "postbuild"): Postbuild[];
  public getPluginHooks(name: "prebuild"): Prebuild[];
  public getPluginHooks(name: "beforeCompile"): CompilerHook[];
  public getPluginHooks(name: "afterCompile"): CompilerHook[];
  public getPluginHooks(name: "afterCompileDeclarations"): CompilerHook[];
  public getPluginHooks(name: string) {
    const pkgPath = path.join(process.cwd(), "package.json");
    if (!fs.existsSync(pkgPath)) {
      return [];
    }

    return this.depsService
      .getDeps(
        path.join(process.cwd(), "package.json"),
        /^(@sfajs\/|sfa\-|sfa(js)?\-|@\S+\/sfa(js)?\-)/
      )
      .map((dep) => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const module = require(dep.key);
          return module[name];
        } catch (err) {
          return undefined;
        }
      })
      .filter((script) => !!script);
  }

  public async execPrebuilds(command: CommandType): Promise<boolean> {
    const internalPrebuild = this.getPluginHooks("prebuild");
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
    const internalPostbuild = this.getPluginHooks("postbuild");
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

import { Inject } from "@sfajs/inject";
import path from "path";
import { AssetsService } from "../services/assets.service";
import { CompilerService } from "../services/compiler.service";
import { ConfigService } from "../services/config.service";
import { TsconfigService } from "../services/tsconfig.service";
import { WatchCompilerService } from "../services/watch-compiler.service";
import * as fs from "fs";
import { BaseMiddlware } from "./base.middleware";
import { CommandType, Postbuild, Prebuild } from "@sfajs/cli-common";
import { DepsService } from "../services/deps.service";

export class BuildMiddlware extends BaseMiddlware {
  override get command(): CommandType {
    return "build";
  }

  @Inject
  private readonly tsconfigService!: TsconfigService;
  @Inject
  private readonly configService!: ConfigService;
  @Inject
  private readonly compilerService!: CompilerService;
  @Inject
  private readonly watchCompilerService!: WatchCompilerService;
  @Inject
  private readonly assetsService!: AssetsService;
  @Inject
  private readonly depsService!: DepsService;

  private get config() {
    return this.configService.value;
  }
  private get cacheDir() {
    return this.tsconfigService.cacheDir;
  }
  private get watch() {
    return this.configService.getOptionOrConfigValue<boolean>(
      "watch",
      "build.watch",
      false
    );
  }
  private get scriptOptions() {
    return {
      config: this.config,
      command: this.command,
      cacheDir: this.cacheDir,
      mode: this.configService.mode,
    };
  }

  override async invoke(): Promise<void> {
    await super.invoke();

    await fs.promises.rm(path.resolve(process.cwd(), this.cacheDir), {
      recursive: true,
      force: true,
    });

    if (!(await this.execPrebuilds())) {
      return;
    }

    await fs.promises.rm(path.join(process.cwd(), this.cacheDir), {
      recursive: true,
      force: true,
    });

    let compilerResult: boolean;
    if (this.watch) {
      compilerResult = this.watchCompilerService.compiler(
        this.cacheDir,
        async () => {
          await this.assetsService.copy();
          await this.execPostbuilds();
          const onWatchSuccess =
            this.ctx.bag<(binaryToRun?: string) => void>("onWatchSuccess");
          if (onWatchSuccess) {
            onWatchSuccess();
          }
        }
      );
    } else {
      compilerResult = this.compilerService.compiler(this.cacheDir);
      if (compilerResult) {
        await this.assetsService.copy();
        await this.execPostbuilds();
      }
    }

    if (compilerResult) {
      await this.next();
    }
  }

  private async execPrebuilds(): Promise<boolean> {
    const internalPrebuild = this.getPluginScripts("prebuild");

    for (const fn of [
      ...internalPrebuild,
      ...(this.config.build?.prebuild ?? []),
    ]) {
      if ((await fn(this.scriptOptions)) == false) {
        return false;
      }
    }
    return true;
  }

  private async execPostbuilds() {
    const internalPostbuild = this.getPluginScripts("postbuild");

    for (const fn of [
      ...internalPostbuild,
      ...(this.config.build?.postbuild ?? []),
    ]) {
      await fn(this.scriptOptions);
    }
  }

  private getPluginScripts(name: "postbuild"): Postbuild[];
  private getPluginScripts(name: "prebuild"): Prebuild[];
  private getPluginScripts(name: "prebuild" | "postbuild") {
    const pkgPath = path.join(process.cwd(), "package.json");
    if (!fs.existsSync(pkgPath)) {
      return [];
    }
    const deps = this.depsService.getProjectSfaDeps(
      path.join(process.cwd(), "package.json"),
      undefined,
      true,
      true
    );
    return deps
      .map((dep) => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const module = require(dep.key);
          return module[name] as Postbuild | Prebuild;
        } catch {
          return undefined;
        }
      })
      .filter((script) => !!script);
  }
}

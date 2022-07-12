import { Inject } from "@ipare/inject";
import path from "path";
import { AssetsService } from "../services/assets.service";
import { CompilerService } from "../services/compiler.service";
import { ConfigService } from "../services/config.service";
import { TsconfigService } from "../services/tsconfig.service";
import { WatchCompilerService } from "../services/watch-compiler.service";
import * as fs from "fs";
import { BaseMiddlware } from "./base.middleware";
import { CommandType } from "../configuration";
import { HookService } from "../services/hook.service";

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
  private readonly hookService!: HookService;

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

  override async invoke(): Promise<void> {
    await super.invoke();

    await fs.promises.rm(path.resolve(process.cwd(), this.cacheDir), {
      recursive: true,
      force: true,
    });

    if (!(await this.hookService.execPrebuilds(this.command))) {
      return;
    }

    await fs.promises.rm(path.join(process.cwd(), this.cacheDir), {
      recursive: true,
      force: true,
    });

    const compilerResult = await this.compile();
    if (compilerResult) {
      await this.next();
    }
  }

  private async compile() {
    if (this.watch) {
      return this.watchCompile();
    } else {
      const compilerResult = this.compilerService.compile(this.cacheDir);
      if (compilerResult) {
        await this.assetsService.copy();
        await this.copyPackage();
        await this.hookService.execPostbuilds(this.command);
      }
      return compilerResult;
    }
  }

  private watchCompile() {
    return this.watchCompilerService.compile(this.cacheDir, async () => {
      await this.assetsService.copy();
      await this.copyPackage();
      await this.hookService.execPostbuilds(this.command);
      const onWatchSuccess =
        this.ctx.bag<() => Promise<void>>("onWatchSuccess");
      if (onWatchSuccess) {
        await onWatchSuccess();
      }
    });
  }

  public async copyPackage() {
    const copy = this.configService.getOptionOrConfigValue(
      "copyPackage",
      "build.copyPackage",
      false
    );
    if (!copy) return;

    const filePath = path.join(process.cwd(), "package.json");
    const targetPath = path.join(this.cacheDir, "package.json");

    await fs.promises.rm(targetPath, {
      force: true,
    });
    await fs.promises.copyFile(filePath, targetPath);
  }
}

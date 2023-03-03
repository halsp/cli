import { Inject } from "@halsp/inject";
import path from "path";
import { AssetsService } from "../services/build.services/assets.service";
import { CompilerService } from "../services/build.services/compiler.service";
import { ConfigService } from "../services/build.services/config.service";
import { TsconfigService } from "../services/build.services/tsconfig.service";
import { WatchCompilerService } from "../services/build.services/watch-compiler.service";
import * as fs from "fs";
import { HookService } from "../services/build.services/hook.service";
import { Middleware } from "@halsp/common";
import prettier from "prettier";

export class BuildMiddlware extends Middleware {
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
      this.ctx.command == "start"
    );
  }

  override async invoke(): Promise<void> {
    await fs.promises.rm(path.resolve(process.cwd(), this.cacheDir), {
      recursive: true,
      force: true,
    });

    if (!(await this.hookService.execPrebuilds())) {
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
        await this.hookService.execPostbuilds();
      }
      return compilerResult;
    }
  }

  private watchCompile() {
    return this.watchCompilerService.compile(this.cacheDir, async () => {
      await this.assetsService.copy();
      await this.copyPackage();
      await this.hookService.execPostbuilds();
      const onWatchSuccess =
        this.ctx.get<() => Promise<void>>("onWatchSuccess");
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
    const removeDevDeps = this.configService.getOptionOrConfigValue(
      "removeDevDeps",
      "build.removeDevDeps",
      false
    );

    const filePath = path.join(process.cwd(), "package.json");
    const targetPath = path.join(this.cacheDir, "package.json");

    await fs.promises.rm(targetPath, {
      force: true,
    });
    if (!removeDevDeps) {
      await fs.promises.copyFile(filePath, targetPath);
    } else {
      const txt = await fs.promises.readFile(filePath, "utf-8");
      const json = JSON.parse(txt);
      json["devDependencies"] = {};
      await fs.promises.writeFile(
        targetPath,
        prettier.format(JSON.stringify(json), {
          parser: "json",
        })
      );
    }
  }
}

import { Middleware } from "@sfajs/core";
import { Inject } from "@sfajs/inject";
import path from "path";
import { AssetItem } from "../configuration";
import { CompilerService } from "../services/compiler.service";
import { ConfigService } from "../services/config.service";
import { FileService } from "../services/file.service";
import { TsconfigService } from "../services/tsconfig.service";
import { WatchCompilerService } from "../services/watch-compiler.service";

export class BuildMiddlware extends Middleware {
  @Inject
  private readonly tsconfigService!: TsconfigService;
  @Inject
  private readonly configService!: ConfigService;
  @Inject
  private readonly fileService!: FileService;
  @Inject
  private readonly compilerService!: CompilerService;
  @Inject
  private readonly watchCompilerService!: WatchCompilerService;

  private get config() {
    return this.configService.value;
  }
  private get outDir() {
    return this.tsconfigService.outDir;
  }
  private get watch() {
    return !!this.ctx.commandOptions.watch;
  }

  async invoke(): Promise<void> {
    if (this.config.build?.prebuild) {
      for (const fn of this.config.build.prebuild) {
        if (!(await fn(this.config))) {
          return;
        }
      }
    }

    if (this.config.build?.deleteOutDir) {
      this.fileService.deleteFile(path.join(process.cwd(), this.outDir));
    }

    let compilerResult: boolean;
    if (this.watch) {
      const onWatchSuccess = this.ctx.res.body.onWatchSuccess;
      compilerResult = this.watchCompilerService.compiler(onWatchSuccess);
    } else {
      compilerResult = this.compilerService.compiler();
    }
    if (!compilerResult) return;

    this.copyAssets();
    if (this.config.build?.postbuild) {
      for (const fn of this.config.build.postbuild) {
        await fn(this.config);
      }
    }
    await this.next();
  }

  private copyAssets() {
    const files: AssetItem[] = [...(this.config.build?.assets ?? [])];
    files.forEach((asset) => {
      let source: string;
      let target: string;
      if (typeof asset == "string") {
        source = asset;
        target = asset;
      } else {
        source = asset.source;
        target = asset.target;
      }
      const sourcePath = path.join(process.cwd(), source);
      const targetPath = path.join(process.cwd(), this.outDir, target);
      this.fileService.copyFile(sourcePath, targetPath);
    });
  }
}

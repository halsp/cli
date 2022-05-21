import { Middleware } from "@sfajs/core";
import { Inject } from "@sfajs/inject";
import path from "path";
import { AssetsService } from "../services/assets.service";
import { CommandService } from "../services/command.service";
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
  @Inject
  private readonly commandService!: CommandService;
  @Inject
  private readonly assetsService!: AssetsService;

  private get config() {
    return this.configService.value;
  }
  private get outDir() {
    return this.tsconfigService.outDir;
  }
  private get watch() {
    return this.commandService.getOptionOrConfigValue<boolean>(
      "watch",
      "build.watch",
      false
    );
  }
  private get deleteOutDir() {
    return this.commandService.getOptionOrConfigValue<boolean>(
      "deleteOutDir",
      "build.deleteOutDir",
      true
    );
  }

  async invoke(): Promise<void> {
    if (!(await this.execPrebuilds())) {
      return;
    }

    if (this.deleteOutDir) {
      this.fileService.deleteFile(path.join(process.cwd(), this.outDir));
    }

    let compilerResult: boolean;
    if (this.watch) {
      compilerResult = this.watchCompilerService.compiler(async () => {
        this.assetsService.copy();
        await this.execPostbuilds();
        this.ctx.res.body?.onWatchSuccess();
      });
    } else {
      compilerResult = this.compilerService.compiler();
      if (compilerResult) {
        this.assetsService.copy();
        await this.execPostbuilds();
      }
    }

    if (compilerResult) {
      await this.next();
    }
  }

  private async execPrebuilds(): Promise<boolean> {
    if (this.config?.build?.prebuild) {
      for (const fn of this.config.build.prebuild) {
        if ((await fn(this.config)) == false) {
          return false;
        }
      }
    }
    return true;
  }

  private async execPostbuilds() {
    if (this.config?.build?.postbuild) {
      for (const fn of this.config.build.postbuild) {
        await fn(this.config);
      }
    }
  }
}

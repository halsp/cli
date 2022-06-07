import { Inject } from "@sfajs/inject";
import path from "path";
import { AssetsService } from "../services/assets.service";
import { CommandService } from "../services/command.service";
import { CompilerService } from "../services/compiler.service";
import { ConfigService } from "../services/config.service";
import { TsconfigService } from "../services/tsconfig.service";
import { WatchCompilerService } from "../services/watch-compiler.service";
import * as fs from "fs";
import { BaseMiddlware } from "./base.middleware";
import { CommandType } from "../utils/command-type";

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
  private readonly commandService!: CommandService;
  @Inject
  private readonly assetsService!: AssetsService;

  private get config() {
    return this.configService.value;
  }
  private get cacheDir() {
    return this.tsconfigService.cacheDir;
  }
  private get watch() {
    return this.commandService.getOptionOrConfigValue<boolean>(
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
    if (this.config.build?.prebuild) {
      for (const fn of this.config.build.prebuild) {
        if ((await fn(this.ctx)) == false) {
          return false;
        }
      }
    }
    return true;
  }

  private async execPostbuilds() {
    if (this.config.build?.postbuild) {
      for (const fn of this.config.build.postbuild) {
        await fn(this.ctx);
      }
    }
  }
}

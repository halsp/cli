import { Middleware } from "@halsp/core";
import { Inject } from "@halsp/inject";
import path from "path";
import { FileService } from "../services/file.service";
import { TsconfigService } from "../services/build.services/tsconfig.service";
import * as fs from "fs";
import { ConfigService } from "../services/build.services/config.service";

export class CopyBuildResultMiddleware extends Middleware {
  @Inject
  private readonly tsconfigService!: TsconfigService;
  @Inject
  private readonly configService!: ConfigService;
  @Inject
  private readonly fileService!: FileService;

  private get outDir() {
    return this.tsconfigService.outDir;
  }
  private get cacheDir() {
    return this.configService.cacheDir;
  }
  private get deleteOutDir() {
    return this.configService.getOptionOrConfigValue<boolean>(
      "deleteOutDir",
      "build.deleteOutDir",
      true,
    );
  }

  async invoke(): Promise<void> {
    if (this.deleteOutDir && fs.existsSync(path.resolve(this.outDir))) {
      const files = await fs.promises.readdir(path.resolve(this.outDir));
      for (const file of files) {
        await fs.promises.rm(path.resolve(this.outDir, file), {
          recursive: true,
          force: true,
        });
      }
    }

    await this.fileService.createDir(this.outDir);

    const files = await fs.promises.readdir(path.resolve(this.cacheDir));
    for (const file of files) {
      await fs.promises.rename(
        path.resolve(this.cacheDir, file),
        path.resolve(this.outDir, file),
      );
    }
  }
}

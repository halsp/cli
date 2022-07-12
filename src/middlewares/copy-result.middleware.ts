import { Middleware } from "@ipare/core";
import { Inject } from "@ipare/inject";
import path from "path";
import { FileService } from "../services/file.service";
import { TsconfigService } from "../services/tsconfig.service";
import * as fs from "fs";
import { ConfigService } from "../services/config.service";

export class CopyResultMiddleware extends Middleware {
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
    return this.tsconfigService.cacheDir;
  }
  private get deleteOutDir() {
    return this.configService.getOptionOrConfigValue<boolean>(
      "deleteOutDir",
      "build.deleteOutDir",
      true
    );
  }

  async invoke(): Promise<void> {
    if (this.deleteOutDir) {
      await fs.promises.rm(path.resolve(process.cwd(), this.outDir), {
        recursive: true,
        force: true,
      });
    }

    await this.fileService.createDir(this.outDir);

    await fs.promises.rename(
      path.resolve(process.cwd(), this.cacheDir),
      path.resolve(process.cwd(), this.outDir)
    );
  }
}

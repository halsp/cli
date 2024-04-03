import { Middleware } from "@halsp/core";
import { Inject } from "@halsp/inject";
import path from "path";
import { FileService } from "../../services/file.service";
import { TsconfigService } from "../../services/build.services/tsconfig.service";
import fs from "fs";
import { ConfigService } from "../../services/build.services/config.service";

export class CacheToDistMiddleware extends Middleware {
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

  async invoke(): Promise<void> {
    await this.fileService.safeMkdir(this.outDir);

    const files = await fs.promises.readdir(path.resolve(this.cacheDir));
    await this.moveFiles(files);

    await this.next();
  }

  async moveFiles(files: string[]) {
    for (const file of files) {
      const sourceFile = path.resolve(this.cacheDir, file);
      const targetFile = path.resolve(this.outDir, file);
      const stat = await fs.promises.stat(sourceFile);

      if (stat.isFile()) {
        await fs.promises.rename(sourceFile, targetFile);
      } else if (stat.isDirectory()) {
        await this.fileService.safeMkdir(targetFile);
        let children = await fs.promises.readdir(sourceFile);
        children = children.map((f) => path.join(file, f));
        await this.moveFiles(children);
        await fs.promises.rm(sourceFile, {
          recursive: true,
          force: true,
        });
      }
    }
  }
}

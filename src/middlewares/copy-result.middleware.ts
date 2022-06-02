import { Middleware } from "@sfajs/core";
import { Inject } from "@sfajs/inject";
import path from "path";
import { CommandService } from "../services/command.service";
import { FileService } from "../services/file.service";
import { TsconfigService } from "../services/tsconfig.service";
import * as fs from "fs";

export class CopyResultMiddleware extends Middleware {
  @Inject
  private readonly tsconfigService!: TsconfigService;
  @Inject
  private readonly commandService!: CommandService;

  private get outDir() {
    return this.tsconfigService.outDir;
  }
  private get cacheDir() {
    return this.tsconfigService.cacheDir;
  }
  private get deleteOutDir() {
    return this.commandService.getOptionOrConfigValue<boolean>(
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
    await fs.promises.rename(
      path.resolve(process.cwd(), this.cacheDir),
      path.resolve(process.cwd(), this.outDir)
    );
  }
}

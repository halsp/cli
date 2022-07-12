import { Inject } from "@ipare/inject";
import * as fs from "fs";
import { FileService } from "./file.service";
import path from "path";
import { CreateEnvService } from "./create-env.service";

const files = ["README.md", "LICENSE"];

export class CopyBaseService {
  @Inject
  private readonly fileService!: FileService;
  @Inject
  private readonly createEnvService!: CreateEnvService;

  private get targetDir() {
    return this.createEnvService.targetDir;
  }

  public async copy() {
    for (const file of files) {
      await this.copyFile(file);
    }
  }

  private async copyFile(fileName: string) {
    const targetFile = path.join(this.targetDir, fileName);
    const sourceFile = path.join(__dirname, "../..", fileName);

    await this.fileService.createDir(targetFile);
    await fs.promises.copyFile(sourceFile, targetFile);
  }
}

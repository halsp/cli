import { Inject } from "@halsp/inject";
import * as fs from "fs";
import { FileService } from "../file.service";
import path from "path";
import { CreateService } from "../create.service";

const files = ["README.md", "LICENSE"];

export class CopyRootService {
  @Inject
  private readonly fileService!: FileService;
  @Inject
  private readonly createService!: CreateService;

  private get targetDir() {
    return this.createService.targetDir;
  }

  public async copy() {
    for (const file of files) {
      await this.copyFile(file);
    }
  }

  private async copyFile(fileName: string) {
    const targetFile = path.join(this.targetDir, fileName);
    const sourceFile = path.join(__dirname, "../../..", fileName);

    await this.fileService.createParentDir(targetFile);
    await fs.promises.copyFile(sourceFile, targetFile);
  }
}

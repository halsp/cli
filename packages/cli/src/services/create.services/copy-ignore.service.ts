import { Inject } from "@ipare/inject";
import * as fs from "fs";
import path from "path";
import { CreateEnvService } from "./create-env.service";

export class CopyIgnoreService {
  @Inject
  private readonly createEnvService!: CreateEnvService;

  private get sourceDir() {
    return path.join(__dirname, `../../../template`);
  }
  private get targetDir() {
    return this.createEnvService.targetDir;
  }

  public async create(): Promise<void> {
    const sourceFileName = this.getGitIgnoreName();
    if (!sourceFileName) return;

    const sourceFilePath = path.join(this.sourceDir, sourceFileName);
    const targetFilePath = path.join(this.targetDir, ".gitignore");
    await fs.promises.copyFile(sourceFilePath, targetFilePath);
  }

  public getIgnoreFiles() {
    const result = [".ipareignore"];

    const gitIgnore = this.getGitIgnoreName();
    if (gitIgnore) {
      result.splice(0, 0, gitIgnore);
    }

    return result;
  }

  private getGitIgnoreName() {
    if (fs.existsSync(path.join(this.sourceDir, ".gitignore"))) {
      return ".gitignore";
    }
    if (fs.existsSync(path.join(this.sourceDir, ".npmignore"))) {
      return ".npmignore";
    }
    return undefined;
  }
}
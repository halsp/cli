import { Inject } from "@halsp/inject";
import * as fs from "fs";
import path from "path";
import { CreateService } from "../create.service";
import { createDirname } from "../../utils/shims";

const __dirname = createDirname(import.meta.url);

export class CopyIgnoreService {
  @Inject
  private readonly createService!: CreateService;

  private get sourceDir() {
    return path.join(__dirname, `../../../scaffold`);
  }
  private get targetDir() {
    return this.createService.targetDir;
  }

  public async create(): Promise<void> {
    const sourceFileName = this.getGitIgnoreName();
    if (!sourceFileName) return;

    const sourceFilePath = path.join(this.sourceDir, sourceFileName);
    const targetFilePath = path.join(this.targetDir, ".gitignore");
    await fs.promises.copyFile(sourceFilePath, targetFilePath);
  }

  public getIgnoreFiles() {
    const result = [".halspignore"];

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

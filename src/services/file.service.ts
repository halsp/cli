import path from "path";
import * as fs from "fs";
import { InquirerService } from "./inquirer.service";
import { Inject } from "@halsp/inject";

export class FileService {
  @Inject
  private readonly inquirerService!: InquirerService;

  public async isOverwrite(message: string): Promise<boolean> {
    const { overwrite } = await this.inquirerService.prompt([
      {
        type: "confirm",
        message: message,
        name: "overwrite",
        default: false,
      },
    ]);
    return overwrite as boolean;
  }

  public async createParentDir(filePath: string) {
    const dirname = path.dirname(filePath);

    await this.safeMkdir(dirname);
  }

  public async safeMkdir(dir: string) {
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, {
        recursive: true,
      });
    }
  }

  public existAny(names: string[]) {
    for (const name of names) {
      const file = path.resolve(name);
      if (fs.existsSync(file)) {
        return name;
      }
    }
  }

  public findFileFromTree(fileName: string, dir = process.cwd()) {
    let count = 0;
    let pkgPath = path.join(dir, fileName);
    while (
      count++ < 16 &&
      !fs.existsSync(pkgPath) &&
      path.dirname(dir) != dir &&
      dir.startsWith(path.dirname(dir))
    ) {
      dir = path.dirname(dir);
      pkgPath = path.join(dir, fileName);
    }
    if (fs.existsSync(pkgPath)) {
      return pkgPath;
    }
    return null;
  }
}

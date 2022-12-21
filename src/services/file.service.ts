import path from "path";
import * as fs from "fs";
import inquirer from "inquirer";

export class FileService {
  public async isOverwrite(message: string): Promise<boolean> {
    const { overwrite } = await inquirer.prompt([
      {
        type: "confirm",
        message: message,
        name: "overwrite",
        default: false,
      },
    ]);
    return overwrite as boolean;
  }

  public async createDir(p: string) {
    const dirname = path.dirname(p);

    if (!fs.existsSync(dirname)) {
      await fs.promises.mkdir(dirname, {
        recursive: true,
      });
    }
  }

  public existAny(names: string[]) {
    for (const name of names) {
      const file = path.resolve(process.cwd(), name);
      if (fs.existsSync(file)) {
        return name;
      }
    }
  }
}

import path from "path";
import * as fs from "fs";
import inquirer from "inquirer";
import glob from "glob";

export class FileService {
  public globDelete(cwd: string, pattern: string, ignore: string[] = []) {
    if (!fs.existsSync(cwd)) return;

    const paths = glob
      .sync(pattern, {
        ignore,
        cwd: cwd,
      })
      .reverse();
    for (const p of paths) {
      const completePath = path.join(cwd, p);
      fs.rmSync(completePath, {
        recursive: true,
        force: true,
      });
    }
  }

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

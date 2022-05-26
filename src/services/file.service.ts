import path from "path";
import * as fs from "fs";
import inquirer from "inquirer";

export class FileService {
  public deleteFile(filePath: string, type?: string) {
    if (!fs.existsSync(filePath)) return;

    const stat = fs.statSync(filePath);
    if (stat.isFile()) {
      if (!type || filePath.endsWith(type)) {
        fs.unlinkSync(filePath);
      }
    } else if (stat.isDirectory()) {
      fs.readdirSync(filePath).forEach((file) => {
        this.deleteFile(path.join(filePath, file), type);
      });
      if (!fs.readdirSync(filePath).length) {
        fs.rmdirSync(filePath);
      }
    }
  }

  public copyFile(source: string, target: string) {
    if (!fs.existsSync(source)) return;
    const stat = fs.statSync(source);
    if (stat.isDirectory()) {
      if (!fs.existsSync(target)) {
        fs.mkdirSync(target);
      }
      const files = fs.readdirSync(source);
      files.forEach((file) => {
        this.copyFile(path.join(source, file), path.join(target, file));
      });
    } else if (stat.isFile()) {
      fs.copyFileSync(source, target);
    }
  }

  public copyCode(
    source: string,
    target: string,
    codeFilter?: (code: string) => string | null,
    ignoreEmpty = false
  ) {
    if (!fs.existsSync(source)) return;
    const stat = fs.statSync(source);
    if (stat.isDirectory()) {
      if (!fs.existsSync(target)) {
        fs.mkdirSync(target);
      }
      const files = fs.readdirSync(source);
      files.forEach((file) => {
        this.copyCode(
          path.join(source, file),
          path.join(target, file),
          codeFilter,
          ignoreEmpty
        );
      });
    } else if (stat.isFile()) {
      let code: string | null = fs.readFileSync(source, "utf-8");
      if (codeFilter) {
        code = codeFilter(code);
      }
      if (ignoreEmpty && !code?.trim()) {
        return;
      }
      fs.writeFileSync(target, code ?? "");
    }
  }

  public removeBlankDir(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isFile()) {
        continue;
      }

      this.removeBlankDir(filePath);
    }

    if (!fs.readdirSync(dir).length) {
      fs.rmdirSync(dir);
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
}

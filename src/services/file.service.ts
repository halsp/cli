import path from "path";
import * as fs from "fs";
import inquirer from "inquirer";
import glob from "glob";

export class FileService {
  public globDelete(
    dirPath: string,
    pattern = "**/*",
    ignoreFile = ".gitignore"
  ) {
    if (!fs.existsSync(dirPath)) return;

    const ignore = this.getIgnore(dirPath, ignoreFile);
    const paths = glob
      .sync(pattern, {
        ignore,
        cwd: dirPath,
      })
      .reverse();
    for (const p of paths) {
      const completePath = path.join(dirPath, p);
      fs.rmSync(completePath, {
        recursive: true,
        force: true,
      });
    }
  }

  public copy(source: string, target: string) {
    if (!fs.existsSync(source)) return;
    const stat = fs.statSync(source);
    if (stat.isDirectory()) {
      if (!fs.existsSync(target)) {
        fs.mkdirSync(target);
      }
      const files = fs.readdirSync(source);
      files.forEach((file) => {
        this.copy(path.join(source, file), path.join(target, file));
      });
    } else if (stat.isFile()) {
      fs.copyFileSync(source, target);
    }
  }

  public globCopy(
    sourceDir: string,
    targetDir: string,
    pattern = "**/*",
    ignoreFile = ".gitignore",
    contentFilter?: (file: string, content: string) => string | null
  ) {
    if (!fs.existsSync(sourceDir)) return;
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir);
    }

    const ignore = this.getIgnore(sourceDir, ignoreFile);
    const paths = glob.sync(pattern, {
      ignore,
      cwd: sourceDir,
      dot: true,
    });

    for (const p of paths) {
      const sourceFile = path.join(sourceDir, p);
      const targetFile = path.join(targetDir, p);
      const stat = fs.statSync(sourceFile);
      if (stat.isDirectory()) {
        if (
          paths.filter((item) => item.startsWith(p)).length > 1 &&
          !fs.existsSync(targetFile)
        ) {
          fs.mkdirSync(targetFile);
        }
      } else if (contentFilter) {
        let content: string | null = fs.readFileSync(sourceFile, "utf-8");
        content = contentFilter(p, content);
        if (content != null) {
          fs.writeFileSync(targetFile, content);
        }
      } else {
        fs.copyFileSync(sourceFile, targetFile);
      }
    }
  }

  private getIgnore(cwd: string, ignoreFile: string) {
    let ignore: string[] = [];
    if (ignoreFile) {
      const ignoreFilePath = path.join(cwd, ignoreFile);
      if (fs.existsSync(ignoreFilePath)) {
        ignore = fs
          .readFileSync(path.join(cwd, ignoreFile), "utf-8")
          .split("\n")
          .map((item) => item.trim())
          .filter((item) => !!item);
      }
    }
    return ignore;
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

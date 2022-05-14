import path from "path";
import * as fs from "fs";

export class FileService {
  deleteFile(filePath: string, type?: string) {
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

  copyFile(source: string, target: string) {
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
}

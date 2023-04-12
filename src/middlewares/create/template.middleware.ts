import { Middleware } from "@halsp/core";
import { Inject } from "@halsp/inject";
import path from "path";
import { RunnerService } from "../../services/runner.service";
import * as fs from "fs";
import walk from "ignore-walk";
import { FileService } from "../../services/file.service";
import { CreateService } from "../../services/create.service";
import glob from "glob";

export class TemplateMiddleware extends Middleware {
  @Inject
  private readonly runnerService!: RunnerService;
  @Inject
  private readonly fileService!: FileService;
  @Inject
  private readonly createService!: CreateService;

  get name() {
    return this.ctx.commandArgs.name;
  }
  private get targetDir() {
    return this.createService.targetDir;
  }
  get template() {
    return this.ctx.commandArgs.template;
  }
  get templateUrl() {
    if (this.template.startsWith("http")) {
      return this.template;
    }

    if (!this.template.includes("/")) {
      return `https://github.com/halsp/templates:${this.template}`;
    }

    return `https://github.com/${this.template}`;
  }
  get cacheDir() {
    return ".halsp-cli-templates";
  }
  get nodeModulesPath() {
    return path.resolve(__dirname, "../../../node_modules");
  }
  get excludesFiles() {
    return [".git/**", ".halspignore"];
  }

  async invoke() {
    await this.clean();

    const templateDir = this.getTemplateDir();
    if (!templateDir) return;

    let paths = await walk({
      path: templateDir,
      ignoreFiles: this.getIgnoreFiles(templateDir),
    });
    const excludesFiles = await this.getExcludeFiles();
    paths = paths
      .map((item) => item.replace(/\\/g, ""))
      .filter((p) => !excludesFiles.some((e) => e == p));

    for (const filePath of paths) {
      const sourceFile = path.resolve(templateDir, filePath);
      const targetFile = path.resolve(this.targetDir, filePath);
      await this.fileService.createDir(targetFile);
      await fs.promises.rename(sourceFile, targetFile);
    }

    await this.clean();

    await this.next();
  }

  private async clean() {
    const cacheDirPath = path.resolve(this.nodeModulesPath, this.cacheDir);
    if (fs.existsSync(cacheDirPath)) {
      await fs.promises.rm(cacheDirPath, {
        force: true,
        recursive: true,
      });
    }
  }

  private getIgnoreFiles(dir: string) {
    const result = [".halspignore"];

    const gitIgnore = this.getGitIgnoreName(dir);
    if (gitIgnore) {
      result.splice(0, 0, gitIgnore);
    }

    return result;
  }

  private async getExcludeFiles() {
    const result: string[] = [];
    for (const excludes of this.excludesFiles) {
      const paths = await glob(excludes, {
        cwd: path.resolve(this.nodeModulesPath, this.cacheDir),
        dot: true,
        nodir: true,
      });
      result.push(...paths);
    }
    return result.map((item) => item.replace(/\\/g, "/"));
  }

  private getGitIgnoreName(dir: string) {
    if (fs.existsSync(path.resolve(dir, ".gitignore"))) {
      return ".gitignore";
    }
    if (fs.existsSync(path.resolve(dir, ".npmignore"))) {
      return ".npmignore";
    }
    return undefined;
  }

  private getTemplateDir() {
    const [url, tmpDir] = this.templateUrl
      .split("|")
      .filter((item) => !!item.trim());

    if (!this.cloneTemplate(url)) {
      return;
    }

    return path.resolve(this.nodeModulesPath, this.cacheDir, tmpDir ?? "");
  }

  private cloneTemplate(url: string) {
    const cloneResult = this.runnerService.run(
      "git",
      ["clone", url, ".halsp-templates"],
      {
        cwd: this.nodeModulesPath,
      }
    );
    return cloneResult.status == 0;
  }
}

import { Middleware } from "@halsp/core";
import { Inject } from "@halsp/inject";
import path from "path";
import { RunnerService } from "../../services/runner.service";
import * as fs from "fs";
import walk from "ignore-walk";
import { FileService } from "../../services/file.service";
import { CreateService } from "../../services/create.service";
import glob from "glob";
import { CommandService } from "../../services/command.service";

export class TemplateMiddleware extends Middleware {
  @Inject
  private readonly runnerService!: RunnerService;
  @Inject
  private readonly fileService!: FileService;
  @Inject
  private readonly createService!: CreateService;
  @Inject
  private readonly commandService!: CommandService;

  get name() {
    return this.ctx.commandArgs.name;
  }
  private get targetDir() {
    return this.createService.targetDir;
  }
  get template() {
    return this.commandService.getOptionVlaue<string>("template")!;
  }
  get templateUrl() {
    if (!this.template.includes("/")) {
      return `https://github.com/halsp/templates`;
    }

    if (this.template.startsWith("http")) {
      return this.template;
    }

    return `https://github.com/${this.template}`;
  }
  get templateChildPath() {
    if (!this.template.includes("/")) {
      return this.template;
    } else {
      return this.commandService.getOptionVlaue<string>("path");
    }
  }
  get nodeModulesPath() {
    return path.resolve(__dirname, "../../../node_modules");
  }
  get cacheDir() {
    return ".halsp-cli-template";
  }
  get cacheDirPath() {
    return path.resolve(this.nodeModulesPath, this.cacheDir);
  }
  get excludesFiles() {
    return [".git/**", ".halspignore"];
  }

  async invoke() {
    await this.clean();

    if (!this.cloneTemplate(this.templateUrl)) {
      return;
    }

    const templateDir = path.resolve(
      this.cacheDirPath,
      this.templateChildPath ?? ""
    );

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
    if (fs.existsSync(this.cacheDirPath)) {
      await fs.promises.rm(this.cacheDirPath, {
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
        cwd: this.cacheDirPath,
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

  private cloneTemplate(url: string) {
    const branch = this.commandService.getOptionVlaue<string>("branch");

    const args = ["clone", url, this.cacheDir];
    if (branch) {
      args.push("-b");
      args.push(branch);
    }
    const cloneResult = this.runnerService.run("git", args, {
      cwd: this.nodeModulesPath,
    });
    return cloneResult.status == 0;
  }
}

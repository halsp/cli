import { Middleware } from "@halsp/core";
import { Inject } from "@halsp/inject";
import { CommandService } from "../../services/command.service";
import { CreateService } from "../../services/create.service";
import { FileService } from "../../services/file.service";
import { RunnerService } from "../../services/runner.service";
import path from "path";
import * as fs from "fs";
import walk from "ignore-walk";
import glob from "glob";
import { ChalkService } from "../../services/chalk.service";

type CopyConfig = {
  template: string;
  path?: string;
  branch?: string;
};

type TemplateConfig = {
  extends?: CopyConfig;
  preCommand?: string;
  postCommand?: string;
};

export class TemplateMiddleware extends Middleware {
  @Inject
  private readonly commandService!: CommandService;
  @Inject
  private readonly runnerService!: RunnerService;
  @Inject
  private readonly fileService!: FileService;
  @Inject
  private readonly createService!: CreateService;
  @Inject
  private readonly chalkService!: ChalkService;

  private get targetDir() {
    return this.createService.targetDir;
  }
  private get nodeModulesPath() {
    return path.resolve(__dirname, "../../../node_modules");
  }
  private get cacheDir() {
    return ".halsp-cli-template";
  }
  private get cacheDirPath() {
    return path.resolve(this.nodeModulesPath, this.cacheDir);
  }
  private get excludesFiles() {
    return [".halspignore", ".halsptemprc.json"];
  }

  async invoke() {
    const copyResult = await this.copy({
      template: this.commandService.getOptionVlaue<string>("template")!,
      branch: this.commandService.getOptionVlaue<string>("branch"),
      path: this.commandService.getOptionVlaue<string>("path"),
    });
    if (copyResult) {
      await this.next();
    }
  }

  async copy(config: CopyConfig): Promise<boolean> {
    await this.clean();

    if (
      !this.cloneTemplate(this.getTemplateUrl(config.template), config.branch)
    ) {
      return false;
    }

    const templateDir = path.resolve(
      this.cacheDirPath,
      this.getTemplateChildPath(config) ?? ""
    );
    const templateConfig = await this.getTemprc(templateDir);
    if (templateConfig.preCommand) {
      console.log(
        this.chalkService.blueBright(
          `Execute preCommand of ${config.template}: ${templateConfig.preCommand}`
        )
      );
      if (!this.runHook(templateDir, templateConfig.preCommand)) {
        return false;
      }
    }

    let paths = await walk({
      path: templateDir,
      ignoreFiles: this.getIgnoreFiles(templateDir),
    });
    const excludesFiles = await this.getExcludeFiles(templateDir);
    paths = paths
      .map((item) => item.replace(/\\/g, "/"))
      .filter((p) => !excludesFiles.some((e) => e == p));

    for (const filePath of paths) {
      const sourceFile = path.resolve(templateDir, filePath);
      const targetFile = path.resolve(this.targetDir, filePath);
      await this.fileService.createDir(targetFile);
      await fs.promises.rename(sourceFile, targetFile);
    }

    if (templateConfig.postCommand) {
      console.log(
        this.chalkService.blueBright(
          `Execute postCommand of ${config.template}: ${templateConfig.postCommand}`
        )
      );
      if (!this.runHook(this.targetDir, templateConfig.postCommand)) {
        return false;
      }
    }

    if (templateConfig.extends) {
      return await this.copy(templateConfig.extends);
    }

    await this.clean();
    return true;
  }

  private runHook(templateDir: string, command: string) {
    const commandRunResult = this.runnerService.run(command, undefined, {
      cwd: templateDir,
    });
    return commandRunResult.status == 0;
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

  private async getExcludeFiles(dir: string) {
    const result: string[] = [];
    for (const excludes of this.excludesFiles) {
      const paths = await glob(excludes, {
        cwd: dir,
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

  private cloneTemplate(url: string, branch?: string) {
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

  private getTemplateChildPath(config: CopyConfig) {
    if (!config.template.includes("/")) {
      return config.template;
    } else {
      return config.path;
    }
  }

  private getTemplateUrl(template: string) {
    if (!template.includes("/")) {
      return `https://github.com/halsp/template`;
    }

    if (template.startsWith("http")) {
      return template;
    }

    return `https://github.com/${template}`;
  }

  private async getTemprc(dir: string): Promise<TemplateConfig> {
    const filePath = path.join(dir, ".halsptemprc.json");
    if (fs.existsSync(filePath)) {
      return JSON.parse(await fs.promises.readFile(filePath, "utf-8"));
    } else {
      return {};
    }
  }
}

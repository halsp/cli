import { Middleware, isString } from "@halsp/core";
import { Inject } from "@halsp/inject";
import { CommandService } from "../../services/command.service";
import { CreateService } from "../../services/create.service";
import { FileService } from "../../services/file.service";
import { RunnerService } from "../../services/runner.service";
import path from "path";
import * as fs from "fs";
import walk from "ignore-walk";
import { glob } from "glob";
import { ChalkService } from "../../services/chalk.service";
import { PackageManagerService } from "../../services/package-manager.service";
import { CliStartup } from "../../cli-startup";
import { InitGitMiddleware } from "./init-git.middleware";
import { RunMiddleware } from "./run.middleware";
import { InstallMiddleware } from "./install.middleware";
import { ScaffoldMiddleware } from "./scaffold.middleware";
import { InquirerService } from "../../services/inquirer.service";

type CopyConfig = {
  template: string;
  path?: string;
  branch?: string;
};

type ScaffoldConfig = {
  options?: Record<string, string | boolean>;
  args?: Record<string, string>;
};

type TemplateConfig = {
  desc?: string;
  extends?: CopyConfig;
  preCommand?: string;
  postCommand?: string;
  scaffold?: ScaffoldConfig;
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
  @Inject
  private readonly packageManagerService!: PackageManagerService;
  @Inject
  private readonly inquirerService!: InquirerService;

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
  private get temprcName() {
    return ".halsptemprc.json";
  }
  private get ignoreName() {
    return ".halspignore";
  }
  private get excludesFiles() {
    return [this.ignoreName, this.temprcName];
  }

  async invoke() {
    const branch = this.commandService.getOptionVlaue<string>("branch");
    const template = await this.getTemplate(branch);
    if (!template) return;

    const copyResult = await this.copy(
      {
        template,
        branch,
        path: this.commandService.getOptionVlaue<string>("path"),
      },
      this.#isSelTemplate
    );
    if (copyResult) {
      await this.next();
    }
  }

  #isSelTemplate = false;
  async getTemplate(branch?: string): Promise<string | undefined> {
    const template = this.commandService.getOptionVlaue<string>("template");
    if (template && isString(template)) return template;

    await this.clean();
    if (!this.cloneTemplate(this.getTemplateUrl(""), branch)) {
      return;
    }

    const templates = await fs.promises.readdir(this.cacheDirPath);
    const templateListConfig = await Promise.all(
      templates
        .filter((t) =>
          fs.statSync(path.resolve(this.cacheDirPath, t)).isDirectory()
        )
        .filter((t) =>
          fs.existsSync(path.resolve(this.cacheDirPath, t, this.temprcName))
        )
        .map(async (t) => {
          return {
            name: t,
            config: await this.getTemprc(path.resolve(this.cacheDirPath, t)),
          };
        })
    );

    this.#isSelTemplate = true;
    const { name } = await this.inquirerService.prompt([
      {
        type: "list",
        message: "Select template",
        name: "name",
        choices: templateListConfig.map((t) => ({
          value: t.name,
          name: t.config.desc ? `${t.name} (${t.config.desc})` : t.name,
        })),
      },
    ]);

    return name;
  }

  async copy(config: CopyConfig, ensureTemplate?: boolean): Promise<boolean> {
    if (!ensureTemplate) {
      await this.clean();

      if (
        !this.cloneTemplate(this.getTemplateUrl(config.template), config.branch)
      ) {
        return false;
      }
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

    if (templateConfig.scaffold) {
      await this.runScaffold(templateConfig.scaffold);
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
    const result = [this.ignoreName];

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
    const filePath = path.join(dir, this.temprcName);
    if (fs.existsSync(filePath)) {
      return JSON.parse(await fs.promises.readFile(filePath, "utf-8"));
    } else {
      return {};
    }
  }

  private async runScaffold(scaffold: ScaffoldConfig) {
    const options = {
      ...this.ctx.commandOptions,
      ...(scaffold.options ?? {}),
    };
    delete options["template"];
    if (!options.packageManager) {
      options.packageManager = await this.packageManagerService.get();
    }

    const args = {
      ...this.ctx.commandArgs,
      ...(scaffold.args ?? {}),
      name: this.createService.name,
    };

    await new CliStartup("create", args, options)
      .add(ScaffoldMiddleware)
      .add(InitGitMiddleware)
      .add(InstallMiddleware)
      .add(RunMiddleware)
      .run();
  }
}

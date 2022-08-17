import * as fs from "fs";
import { CreateTemplateService } from "../services/create.services/create-template.service";
import { Inject } from "@ipare/inject";
import { FileService } from "../services/file.service";
import { CreateEnvService } from "../services/create.services/create-env.service";
import { PluginSelectService } from "../services/create.services/plugin-select.service";
import { CreatePackageService } from "../services/create.services/create-package.service";
import path from "path";
import { CommandService } from "../services/command.service";
import { allPlugins, Plugin } from "../utils/plugins";
import { CopyBaseService } from "../services/create.services/copy-base-files.service";
import inquirer from "inquirer";
import { RunnerService } from "../services/runner.service";
import { Middleware } from "@ipare/core";
import chalk from "chalk";

export class CreateMiddleware extends Middleware {
  @Inject
  private readonly createTemplateService!: CreateTemplateService;
  @Inject
  private readonly createEnvService!: CreateEnvService;
  @Inject
  private readonly createPackageService!: CreatePackageService;
  @Inject
  private readonly pluginSelectService!: PluginSelectService;
  @Inject
  private readonly fileService!: FileService;
  @Inject
  private readonly commandService!: CommandService;
  @Inject
  private readonly copyBaseService!: CopyBaseService;
  @Inject
  private readonly runnerService!: RunnerService;

  private get targetDir() {
    return this.createEnvService.targetDir;
  }

  override async invoke(): Promise<void> {
    await this.checkName();

    if (fs.existsSync(this.targetDir)) {
      const force = this.commandService.getOptionVlaue<boolean>("force");
      if (force) {
        await fs.promises.rm(this.targetDir, {
          force: true,
          recursive: true,
        });
      } else {
        const message = `Target directory ${this.targetDir} already exists. Overwrite?`;
        if (!(await this.fileService.isOverwrite(message))) {
          return;
        }
      }
    }

    if (!fs.existsSync(this.targetDir)) {
      await fs.promises.mkdir(this.targetDir, {
        recursive: true,
      });
    }

    const plugins = await this.getPlugins();
    const env = await this.createEnvService.create();
    if (env) {
      plugins.push(env);
    }

    const createPackageResult = await this.createPackageService.create(plugins);
    if (!createPackageResult) return;
    await this.copyBaseService.copy();

    const fixedPlugins = await this.pluginSelectService.fixPlugins(
      plugins,
      path.join(this.targetDir)
    );

    const consolePlugins = fixedPlugins
      .filter((p) => p != "core")
      .map((p) => `@ipare/${p}`);
    console.log("\n");
    console.log(
      chalk.bold("Fixed plugins"),
      chalk.greenBright(consolePlugins.join(", "))
    );
    console.log("\n");

    await this.createTemplateService.create(fixedPlugins);
    this.initGit();
    this.runApp();
  }

  private initGit() {
    if (this.commandService.getOptionVlaue<boolean>("skipGit")) {
      return;
    }

    this.runnerService.run("git", "init", {
      cwd: this.targetDir,
    });
  }

  private runApp() {
    if (this.commandService.getOptionVlaue<boolean>("skipRun")) {
      return;
    }

    this.runnerService.run("npm", "start", {
      cwd: this.targetDir,
    });
  }

  private async getPlugins() {
    if (this.commandService.getOptionVlaue<boolean>("skipPlugins")) {
      return [];
    }

    let plugins: Plugin[];
    const argPlugins = this.commandService.getOptionVlaue<string>("plugins");
    if (argPlugins) {
      plugins = argPlugins
        .split(/\b|,/)
        .map((item) => item.trim())
        .filter((item) => !!item)
        .map((item) => item as Plugin)
        .filter((item) => allPlugins.some((ap) => ap.value == item));
    } else {
      plugins = await this.pluginSelectService.select();
    }
    return plugins;
  }

  private async checkName(): Promise<void> {
    if (this.ctx.commandArgs.name) {
      return;
    }

    const { name } = await inquirer.prompt([
      {
        type: "input",
        message: "Project name:",
        name: "name",
        default: "ipare-project",
        validate: (input) => {
          const result = /^[^?v\*|""<>:/]{1,256}$/.test(input.trim());
          if (result) {
            return true;
          } else {
            return "Illegal name, please try again.";
          }
        },
      },
    ]);
    this.ctx.commandArgs.name = name.trim();
  }
}

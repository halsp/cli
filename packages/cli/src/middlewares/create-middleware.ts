import * as fs from "fs";
import { CreateTemplateService } from "../services/create-template.service";
import { Inject } from "@sfajs/inject";
import { FileService } from "../services/file.service";
import { CreateEnvService } from "../services/create-env.service";
import { PluginSelectService } from "../services/plugin-select.service";
import { CommandType } from "../configuration";
import { BaseMiddlware } from "./base.middleware";
import { CreatePackageService } from "../services/create-package.service";
import { CreateConfigService } from "../services/create-config.service";
import path from "path";
import { CommandService } from "../services/command.service";
import { allPlugins, Plugin } from "../utils/plugins";
import { CopyBaseService } from "../services/copy-base-files.service";
import inquirer from "inquirer";

export class CreateMiddleware extends BaseMiddlware {
  override get command(): CommandType {
    return "create";
  }

  @Inject
  private readonly createTemplateService!: CreateTemplateService;
  @Inject
  private readonly createEnvService!: CreateEnvService;
  @Inject
  private readonly createPackageService!: CreatePackageService;
  @Inject
  private readonly createConfigService!: CreateConfigService;
  @Inject
  private readonly pluginSelectService!: PluginSelectService;
  @Inject
  private readonly fileService!: FileService;
  @Inject
  private readonly commandService!: CommandService;
  @Inject
  private readonly copyBaseService!: CopyBaseService;

  private get targetDir() {
    return this.createEnvService.targetDir;
  }

  override async invoke(): Promise<void> {
    await super.invoke();

    if (!(await this.checkName())) {
      return;
    }

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
    await this.createConfigService.create(fixedPlugins);
    await this.createTemplateService.create(fixedPlugins);

    await this.next();
  }

  private async getPlugins() {
    if (this.commandService.getOptionVlaue<boolean>("skip-plugins")) {
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

  private async checkName(): Promise<boolean> {
    if (this.ctx.commandArgs.name) {
      return true;
    }

    const { name } = await inquirer.prompt([
      {
        type: "input",
        message: "Project name:",
        name: "name",
        default: "sfa-project",
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
    return true;
  }
}

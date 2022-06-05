import * as fs from "fs";
import { CreateTemplateService } from "../services/create-template.service";
import { Inject } from "@sfajs/inject";
import { FileService } from "../services/file.service";
import { CreateEnvService } from "../services/create-env.service";
import { PluginSelectService } from "../services/plugin-select.service";
import { CommandType } from "../utils/command-type";
import { BaseMiddlware } from "./base.middleware";
import { CreatePackageService } from "../services/create-package.service";
import { CreateConfigService } from "../services/create-config.service";
import path from "path";

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

  private get targetDir() {
    return this.createEnvService.targetDir;
  }

  override async invoke(): Promise<void> {
    await super.invoke();

    if (fs.existsSync(this.targetDir)) {
      const message = `Target directory ${this.targetDir} already exists. Overwrite?`;
      if (!(await this.fileService.isOverwrite(message))) {
        return;
      }
    }

    if (!fs.existsSync(this.targetDir)) {
      await fs.promises.mkdir(this.targetDir, {
        recursive: true,
      });
    }

    const plugins = await this.pluginSelectService.select();

    await this.createPackageService.create(plugins);
    await this.createConfigService.create();

    const fixedPlugins = this.pluginSelectService.fixPlugins(
      plugins,
      path.join(this.targetDir)
    );
    await this.createTemplateService.create(fixedPlugins);
    await this.createEnvService.create();

    await this.next();
  }
}

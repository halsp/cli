import * as fs from "fs";
import { CreateTemplateService } from "../services/create-template.service";
import { Inject } from "@sfajs/inject";
import { FileService } from "../services/file.service";
import { CreateEnvService } from "../services/create-env.service";
import { PluginSelectService } from "../services/plugin-select.service";
import { CommandType } from "../utils/command-type";
import { BaseMiddlware } from "./base.middleware";

export class CreateMiddleware extends BaseMiddlware {
  override get command(): CommandType {
    return "create";
  }

  @Inject
  private readonly createTemplateService!: CreateTemplateService;
  @Inject
  private readonly createEnvService!: CreateEnvService;
  @Inject
  private readonly pluginSelectService!: PluginSelectService;
  @Inject
  private readonly fileService!: FileService;

  private get targetDir() {
    return this.createEnvService.targetDir;
  }

  override async invoke(): Promise<void> {
    super.invoke();

    if (fs.existsSync(this.targetDir)) {
      const message = `Target directory ${this.targetDir} already exists. Overwrite?`;
      if (!(await this.fileService.isOverwrite(message))) {
        return;
      }
    }

    const plugins = await this.pluginSelectService.select();
    this.createTemplateService.create(plugins, this.targetDir);

    await this.createEnvService.create();

    await this.next();
  }
}

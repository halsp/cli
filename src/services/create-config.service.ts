import { Inject } from "@sfajs/inject";
import path from "path";
import { CreateEnvService } from "./create-env.service";
import * as fs from "fs";
import { PackageManager } from "@sfajs/cli-common";
import { Context } from "@sfajs/pipe";
import { HttpContext } from "@sfajs/core";
import { CreateTemplateService } from "./create-template.service";
import { Plugin } from "../types";
import prettier from "prettier";

export class CreateConfigService {
  @Context
  private readonly ctx!: HttpContext;
  @Inject
  private readonly createEnvService!: CreateEnvService;
  @Inject
  private readonly createTemplateService!: CreateTemplateService;

  private get targetDir() {
    return this.createEnvService.targetDir;
  }
  private get targetFile() {
    return path.join(this.targetDir, "sfa-cli.config.ts");
  }
  private get sourceFile() {
    return path.join(__dirname, "../../template/sfa-cli.config.ts");
  }

  public async create(plugins: Plugin[]): Promise<void> {
    let code = await fs.promises.readFile(this.sourceFile, "utf-8");

    const pm = this.ctx.bag<PackageManager>("PACKAGE_MANAGER");
    code = code.replace("{{PACKAGE_MANAGER}}", pm);

    code = this.createTemplateService.readFile(code, plugins) as string;
    code = prettier.format(code, {
      parser: "typescript",
    });

    await fs.promises.writeFile(this.targetFile, code);
  }
}

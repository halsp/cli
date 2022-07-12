import { Inject } from "@ipare/inject";
import path from "path";
import { CreateEnvService } from "./create-env.service";
import * as fs from "fs";
import { Context } from "@ipare/pipe";
import { HttpContext } from "@ipare/core";
import { CreateTemplateService } from "./create-template.service";
import prettier from "prettier";
import { FileService } from "./file.service";
import { Plugin } from "../utils/plugins";

export class CreateConfigService {
  @Context
  private readonly ctx!: HttpContext;
  @Inject
  private readonly createEnvService!: CreateEnvService;
  @Inject
  private readonly createTemplateService!: CreateTemplateService;
  @Inject
  private readonly fileService!: FileService;

  private get targetDir() {
    return this.createEnvService.targetDir;
  }
  private get targetFile() {
    return path.join(this.targetDir, "ipare-cli.config.ts");
  }
  private get sourceFile() {
    return path.join(__dirname, "../../template/ipare-cli.config.ts");
  }

  public async create(plugins: Plugin[]): Promise<void> {
    let code = await fs.promises.readFile(this.sourceFile, "utf-8");

    const pm = this.ctx.bag<string>("PACKAGE_MANAGER");
    code = code.replace("{{PACKAGE_MANAGER}}", pm);

    code = this.createTemplateService.readFile(code, plugins) as string;
    code = prettier.format(code, {
      parser: "typescript",
    });

    await this.fileService.createDir(this.targetFile);
    await fs.promises.writeFile(this.targetFile, code);
  }
}

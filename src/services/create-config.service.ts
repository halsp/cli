import { Inject } from "@sfajs/inject";
import path from "path";
import { CreateEnvService } from "./create-env.service";
import * as fs from "fs";
import { PackageManager } from "../configuration";
import { Context } from "@sfajs/pipe";
import { HttpContext } from "@sfajs/core";

export class CreateConfigService {
  @Context
  private readonly ctx!: HttpContext;
  @Inject
  private readonly createEnvService!: CreateEnvService;

  private get targetDir() {
    return this.createEnvService.targetDir;
  }
  private get targetFile() {
    return path.join(this.targetDir, "sfa-cli.config.ts");
  }
  private get sourceFile() {
    return path.join(__dirname, "../../template/sfa-cli.config.ts");
  }

  public async create(): Promise<void> {
    let code = await fs.promises.readFile(this.sourceFile, "utf-8");

    const pm = this.ctx.bag<PackageManager>("PACKAGE_MANAGER");
    code = code.replace("{{PACKAGE_MANAGER}}", pm);

    await fs.promises.writeFile(this.targetFile, code);
  }
}

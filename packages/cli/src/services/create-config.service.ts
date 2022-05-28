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

  public async create(): Promise<void> {
    const sourceFile = path.join(__dirname, "../../template/sfa-cli.config.ts");
    const targetFile = path.join(this.targetDir, "sfa-cli.config.ts");

    let code = fs.readFileSync(sourceFile, "utf-8");

    const pm = this.ctx.bag<PackageManager>("PACKAGE_MANAGER");
    code = code.replace("{{PACKAGE_MANAGER}}", pm);

    fs.writeFileSync(targetFile, code);
  }
}

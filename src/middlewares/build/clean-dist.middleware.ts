import { Middleware } from "@halsp/core";
import { Inject } from "@halsp/inject";
import path from "path";
import { TsconfigService } from "../../services/build.services/tsconfig.service";
import fs from "fs";
import { ConfigService } from "../../services/build.services/config.service";

export class CleanDistMiddleware extends Middleware {
  @Inject
  private readonly tsconfigService!: TsconfigService;
  @Inject
  private readonly configService!: ConfigService;

  private get outDir() {
    return this.tsconfigService.outDir;
  }
  private get cleanDist() {
    return this.configService.getOptionOrConfigValue<boolean>(
      "cleanDist",
      "build.cleanDist",
    );
  }

  async invoke(): Promise<void> {
    if (this.ctx.command != "clean" && !this.cleanDist) {
      return await this.next();
    }

    if (!fs.existsSync(path.resolve(this.outDir))) {
      return await this.next();
    }

    const files = await fs.promises.readdir(path.resolve(this.outDir));
    for (const file of files) {
      await fs.promises.rm(path.resolve(this.outDir, file), {
        recursive: true,
        force: true,
      });
    }

    await this.next();
  }
}

import path from "path";
import * as fs from "fs";
import { Context } from "@halsp/core";
import chalk from "chalk";
import { Inject } from "@halsp/inject";
import { CommandService } from "../command.service";
import { PackageManagerService } from "../package-manager.service";
import { createDirname, createRequire } from "../../utils/shims";

const require = createRequire(import.meta.url);
const __dirname = createDirname(import.meta.url);

export class InitService {
  @Inject
  private readonly ctx!: Context;
  @Inject
  private readonly commandService!: CommandService;
  @Inject
  private readonly packageManagerService!: PackageManagerService;

  public async init(pm: string) {
    const cliVersion = getCliVersion();
    const initFlatFilePath = path.join(
      __dirname,
      "../../../scaffold/node_modules",
      cliVersion,
    );
    if (this.commandService.getOptionVlaue<boolean>("forceInit")) {
      this.ctx.logger.info(
        chalk.magentaBright("Force init scaffold. Please wait..."),
      );
    } else {
      if (fs.existsSync(initFlatFilePath)) {
        return true;
      }
      this.ctx.logger.info(
        chalk.magentaBright(
          "The command is used for the first time and is being initialized. Please wait...",
        ),
      );
    }

    const installResult = await this.packageManagerService.install(
      pm,
      path.join(__dirname, "../../../scaffold"),
    );
    if (installResult.status == 0) {
      await fs.promises.writeFile(initFlatFilePath, cliVersion);
    }
    return installResult.status == 0;
  }
}

function getCliVersion() {
  const file = path.join(__dirname, "../../../package.json");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require(file).version;
}

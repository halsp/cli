import { Middleware } from "@halsp/core";
import * as fs from "fs";
import path from "path";
import { Inject } from "@halsp/inject";
import { CommandService } from "../services/command.service";
import { dynamicImportDefault } from "../utils/dynamic-import";

export class CheckUpdateMiddleware extends Middleware {
  @Inject
  private readonly commandService!: CommandService;

  async invoke() {
    if (this.commandService.getOptionVlaue<boolean>("skipCheckUpdate")) {
      return await this.next();
    }

    const pkg = await this.getPkg();
    const notifier = await this.getNotifier(pkg);
    notifier.notify({
      isGlobal: true,
    });

    await this.next();
  }

  private async getNotifier(pkg: any) {
    const updateNotifier =
      await dynamicImportDefault<(typeof import("update-notifier"))["default"]>(
        "update-notifier",
      );
    return updateNotifier({
      pkg,
      updateCheckInterval: 1000 * 60 * 60 * 24, // 1 day
    });
  }

  private async getPkg() {
    return JSON.parse(
      await fs.promises.readFile(
        path.join(__dirname, "../../package.json"),
        "utf-8",
      ),
    );
  }
}

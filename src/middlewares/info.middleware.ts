import figlet from "figlet";
import chalk from "chalk";
import os from "os";
import * as fs from "fs";
import path from "path";
import { DepsService } from "../services/deps.service";
import { Inject } from "@ipare/inject";
import { Middleware } from "@ipare/core";

export class InfoMiddleware extends Middleware {
  @Inject
  private readonly depsService!: DepsService;

  get logInfo() {
    return this.logger.info.bind(this.logger);
  }

  override async invoke(): Promise<void> {
    const pkg = JSON.parse(
      await fs.promises.readFile(
        path.join(__dirname, "../../package.json"),
        "utf-8"
      )
    );

    const text = figlet.textSync("IPARECLI");
    this.logInfo("\n");
    this.logInfo(chalk.rgb(0x19, 0xc9, 0xac)(text));

    this.logTitle("System Information");
    this.logItems([
      {
        key: "OS Type",
        value: os.type(),
      },
      {
        key: "OS Platform",
        value: os.platform(),
      },
      {
        key: "OS Release",
        value: os.release(),
      },
      {
        key: "NodeJS Version",
        value: process.version,
      },
    ]);

    this.logTitle("Ipare CLI");
    this.logItems([
      {
        key: "Ipare CLI Version",
        value: pkg.version,
      },
    ]);

    this.logTitle("Ipare Packages Version");
    this.logItems(
      this.depsService.getProjectIpareDeps(
        path.join(process.cwd(), "package.json")
      )
    );
    await this.next();
  }

  private logTitle(titie: string) {
    this.logInfo("\n" + chalk.bold.cyanBright(`[${titie}]`));
  }

  private logItems(items: { key: string; value: string }[]) {
    const keyLen = Math.max(...items.map((item) => item.key.length));
    for (const item of items) {
      this.logInfo(
        item.key.padEnd(keyLen + 1, " ") +
          ": " +
          chalk.rgb(0x19, 0xc9, 0xac)(item.value)
      );
    }
  }
}

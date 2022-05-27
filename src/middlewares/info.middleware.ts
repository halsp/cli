import figlet from "figlet";
import chalk from "chalk";
import os from "os";
import * as fs from "fs";
import path from "path";
import { DepsService } from "../services/deps.service";
import { Inject } from "@sfajs/inject";
import { BaseMiddlware } from "./base.middleware";
import { CommandType } from "../utils/command-type";

export class InfoMiddleware extends BaseMiddlware {
  override get command(): CommandType {
    return "info";
  }

  @Inject
  private readonly depsService!: DepsService;

  get log() {
    return console.log;
  }

  override async invoke(): Promise<void> {
    super.invoke();

    const text = figlet.textSync("SFAJSCLI");
    this.log("\n");
    this.log(chalk.rgb(0x19, 0xc9, 0xac)(text));

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

    this.logTitle("Sfa CLI");
    this.logItems([
      {
        key: "Sfa CLI Version",
        value: JSON.parse(
          fs.readFileSync(path.join(__dirname, "../../package.json")).toString()
        ).version,
      },
    ]);

    this.logTitle("Sfa Packages Version");
    this.logItems(
      this.depsService.getProjectSfaDeps(
        path.join(process.cwd(), "package.json")
      )
    );
    await this.next();
  }

  private logTitle(titie: string) {
    this.log("\n" + chalk.bold.cyanBright(`[${titie}]`));
  }

  private logItems(items: { key: string; value: string }[]) {
    const keyLen = Math.max(...items.map((item) => item.key.length));
    for (const item of items) {
      this.log(
        item.key.padEnd(keyLen + 1, " ") +
          ": " +
          chalk.rgb(0x19, 0xc9, 0xac)(item.value)
      );
    }
  }
}

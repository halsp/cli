import { Middleware } from "@sfajs/core";
import figlet from "figlet";
import chalk from "chalk";
import os from "os";
import * as fs from "fs";
import path from "path";

type InfoItem = { key: string; value: string };

export class InfoMiddleware extends Middleware {
  get log() {
    return console.log;
  }

  async invoke(): Promise<void> {
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
    this.logItems(this.getSfaDeps(path.join(process.cwd(), "package.json")));
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

  private getSfaDeps(packagePath: string, parentResult?: InfoItem[]) {
    const result: InfoItem[] = [];
    const value = JSON.parse(fs.readFileSync(packagePath, "utf-8"));
    const deps = value.dependencies ?? {};
    const pkgs = Object.keys(deps)
      .filter(
        (name) =>
          name.startsWith("@sfajs/") &&
          (!parentResult || !parentResult.some((exist) => exist.key == name))
      )
      .map((name) => ({
        key: name,
        value: deps[name],
      }));

    result.push(...pkgs);

    pkgs.forEach((pkg) => {
      const depPackagePath = require.resolve(pkg.key + "/package.json", {
        paths: [process.cwd()],
      });
      result.push(...this.getSfaDeps(depPackagePath, result));
    });
    return result;
  }
}

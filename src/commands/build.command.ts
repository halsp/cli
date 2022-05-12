import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import * as shell from "shelljs";
import { StaticItem } from "..";
import { Configuration, loadConfig } from "../configuration";
import { BaseCommand } from "./base.command";

const tsconfigPath = path.join(process.cwd(), "tsconfig.json");

export class BuildCommand extends BaseCommand {
  register(command: Command): void {
    command
      .command("build")
      .alias("b")
      .description("Build sfa application.")
      .action(this.invoke.bind(this));
  }

  #config?: Configuration;
  public get config() {
    if (!this.#config) {
      this.#config = loadConfig();
    }
    return this.#config;
  }

  #isTs?: boolean;
  public get isTs() {
    if (this.#isTs == undefined) {
      this.#isTs = fs.existsSync(tsconfigPath);
    }
    return this.#isTs;
  }

  #tsConfig?: any;
  public get tsConfig() {
    if (this.#isTs && this.#tsConfig == undefined) {
      this.#tsConfig = JSON.parse(fs.readFileSync(tsconfigPath, "utf-8"));
    }
    return this.#tsConfig;
  }

  public get outDir() {
    if (!this.isTs) return "";

    return this.tsConfig?.compilerOptions?.outDir || "dist";
  }

  async invoke() {
    if (this.config?.build?.prebuild) {
      for (const fun of this.config.build.prebuild) {
        if ((await fun(this.config)) == false) {
          return;
        }
      }
    }

    if (this.isTs) {
      this.buildTs();
    }

    if (this.config?.build?.postbuild) {
      for (const fun of this.config.build.postbuild) {
        await fun(this.config);
      }
    }
  }

  private buildTs() {
    if (this.config?.build?.deleteOutDir) {
      this.deleteFile(path.join(process.cwd(), this.outDir));
    }

    const tscResult = shell.exec(`tsc`);
    if (tscResult.code != 0) {
      throw new Error(tscResult.stderr);
    } else {
      console.log(tscResult.stdout);
    }

    if (this.config?.build?.deleteBuildFileTypes) {
      for (const type of this.config?.build?.deleteBuildFileTypes) {
        this.deleteFile(this.outDir, type);
      }
    }

    this.copyStaticFiles(this.outDir);
  }

  private copyStaticFiles(outDir: string) {
    const files: StaticItem[] = [...(this.config?.build?.static ?? [])];
    files.forEach((staticItem) => {
      let source: string;
      let target: string;
      if (typeof staticItem == "string") {
        source = staticItem;
        target = staticItem;
      } else {
        source = staticItem.source;
        target = staticItem.target;
      }
      const sourcePath = path.join(process.cwd(), source);
      const targetPath = path.join(process.cwd(), outDir, target);
      this.copyFile(sourcePath, targetPath);
    });
  }

  private deleteFile(filePath: string, type?: string) {
    if (!fs.existsSync(filePath)) return;

    const stat = fs.statSync(filePath);
    if (stat.isFile()) {
      if (!type || filePath.endsWith(type)) {
        fs.unlinkSync(filePath);
      }
    } else if (stat.isDirectory()) {
      fs.readdirSync(filePath).forEach((file) => {
        this.deleteFile(path.join(filePath, file), type);
      });
      if (!fs.readdirSync(filePath).length) {
        fs.rmdirSync(filePath);
      }
    }
  }

  private copyFile(source: string, target: string) {
    if (!fs.existsSync(source)) return;
    const stat = fs.statSync(source);
    if (stat.isDirectory()) {
      if (!fs.existsSync(target)) {
        fs.mkdirSync(target);
      }
      const files = fs.readdirSync(source);
      files.forEach((file) => {
        this.copyFile(path.join(source, file), path.join(target, file));
      });
    } else if (stat.isFile()) {
      fs.copyFileSync(source, target);
    }
  }
}

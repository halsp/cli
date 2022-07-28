import { isUndefined } from "@ipare/core";
import { Inject } from "@ipare/inject";
import path from "path";
import * as fs from "fs";
import { TsconfigService } from "../services/build.services/tsconfig.service";
import spawn from "cross-spawn";
import killProcess from "tree-kill";
import { START_DEV_FILE_NAME } from "../constant";
import { treeKillSync } from "../utils/tree-kill";
import { BaseMiddlware } from "./base.middleware";
import { CommandType } from "../configuration";
import shell from "shelljs";
import { ConfigService } from "../services/build.services/config.service";
import { ChildProcess } from "child_process";

export class StartMiddleware extends BaseMiddlware {
  override get command(): CommandType {
    return "start";
  }

  @Inject
  private readonly tsconfigService!: TsconfigService;
  @Inject
  private readonly configService!: ConfigService;

  private get cacheDir() {
    return this.tsconfigService.cacheDir;
  }
  private get debug() {
    return this.configService.getOptionOrConfigValue<boolean>(
      "debug",
      "build.debug",
      false
    );
  }
  private get mode() {
    return this.configService.mode;
  }
  private get startupFile() {
    const result = this.configService.getOptionOrConfigValue<string>(
      "startupFile",
      "startupFile",
      START_DEV_FILE_NAME
    );
    if (result.includes(".")) {
      return result;
    } else {
      return result + ".js";
    }
  }
  private get port() {
    return this.configService.getOptionOrConfigValue<string>(
      "port",
      "start.port",
      "2333"
    );
  }
  private get watch() {
    return this.configService.getOptionOrConfigValue<boolean>(
      "watch",
      "build.watch",
      false
    );
  }
  private get binaryToRun() {
    return this.configService.getOptionOrConfigValue<string>(
      "binaryToRun",
      "start.binaryToRun",
      "node"
    );
  }

  override async invoke(): Promise<void> {
    await super.invoke();

    if (this.watch) {
      this.ctx.bag("onWatchSuccess", this.createOnWatchSuccess());
    }

    await this.next();

    if (!this.watch) {
      if (isUndefined(this.ctx.commandOptions["enterFile"])) {
        await this.copyEnterFile();
      }

      const processArgs = this.getProcessArgs();
      shell.exec(`${this.binaryToRun} ${processArgs.join(" ")}`, {
        cwd: this.cacheDir,
      });
    }
  }

  private createOnWatchSuccess() {
    let childProcessRef: ChildProcess | undefined;
    process.on(
      "exit",
      () => childProcessRef?.pid && treeKillSync(childProcessRef.pid)
    );

    const createChildProcess = () => {
      childProcessRef = this.spawnChildProcess();
      childProcessRef.on("exit", (code: number) => {
        process.exitCode = code;
        childProcessRef = undefined;
      });
    };

    return async () => {
      if (isUndefined(this.ctx.commandOptions["enterFile"])) {
        await this.copyEnterFile();
      }

      if (childProcessRef) {
        childProcessRef.removeAllListeners("exit");
        childProcessRef.on("exit", () => {
          createChildProcess();
        });

        childProcessRef.stdin && childProcessRef.stdin.destroy();
        if (childProcessRef.pid) {
          killProcess(childProcessRef.pid);
        }
      } else {
        createChildProcess();
      }
    };
  }

  private spawnChildProcess() {
    const processArgs = this.getProcessArgs();
    return spawn(this.binaryToRun, processArgs, {
      stdio: "inherit",
      cwd: this.cacheDir,
    });
  }

  private getProcessArgs() {
    let outputFilePath = path.resolve(
      process.cwd(),
      this.cacheDir,
      this.startupFile
    );
    if (!fs.existsSync(outputFilePath)) {
      throw new Error("Can't find startup file");
    }

    let childProcessArgs: string[] = [];
    const argsStartIndex = process.argv.indexOf("--");
    if (argsStartIndex >= 0) {
      childProcessArgs = process.argv.slice(argsStartIndex + 1);
    }
    outputFilePath =
      outputFilePath.indexOf(" ") >= 0 ? `"${outputFilePath}"` : outputFilePath;

    const processArgs = [outputFilePath, ...childProcessArgs];
    if (this.debug) {
      const inspectFlag =
        typeof this.debug === "string"
          ? `--inspect=${this.debug}`
          : "--inspect";
      processArgs.unshift(inspectFlag);
    }
    return processArgs;
  }

  private async copyEnterFile() {
    let code = await fs.promises.readFile(
      path.join(__dirname, "../enter-startup.js"),
      "utf-8"
    );
    code = code.replace("{{MODE}}", this.mode);
    code = code.replace("{{PORT}}", this.port);
    await fs.promises.writeFile(
      path.resolve(process.cwd(), this.cacheDir, START_DEV_FILE_NAME),
      code
    );
  }
}

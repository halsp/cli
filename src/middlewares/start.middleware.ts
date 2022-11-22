import { isString, Middleware } from "@ipare/core";
import { Inject } from "@ipare/inject";
import path from "path";
import * as fs from "fs";
import { TsconfigService } from "../services/build.services/tsconfig.service";
import spawn from "cross-spawn";
import killProcess from "tree-kill";
import { START_DEV_FILE_NAME } from "../constant";
import { treeKillSync } from "../utils/tree-kill";
import shell from "shelljs";
import { ConfigService } from "../services/build.services/config.service";
import { ChildProcess } from "child_process";
import { DepsService } from "../services/deps.service";
import { slsPackages } from "../utils/plugins";

export class StartMiddleware extends Middleware {
  @Inject
  private readonly tsconfigService!: TsconfigService;
  @Inject
  private readonly configService!: ConfigService;
  @Inject
  private readonly depsService!: DepsService;

  private get cacheDir() {
    return this.tsconfigService.cacheDir;
  }
  private get inspect() {
    return this.configService.getOptionOrConfigValue<boolean | string>(
      "inspect",
      "start.inspect",
      false
    );
  }
  private get startupFile() {
    const result = this.configService.getOptionOrConfigValue<string>(
      "startupFile",
      "startu.startupFile",
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
      "start.port"
    );
  }
  private get watch() {
    return this.configService.getOptionOrConfigValue<boolean>(
      "watch",
      "build.watch",
      true
    );
  }
  private get binaryToRun() {
    return this.configService.getOptionOrConfigValue<string>(
      "binaryToRun",
      "start.binaryToRun",
      "node"
    );
  }
  private get processEnv() {
    return {
      IPARE_DEBUG_PORT: this.port,
      NODE_ENV: this.configService.mode,
    };
  }

  override async invoke(): Promise<void> {
    if (this.watch) {
      this.ctx.bag("onWatchSuccess", this.createOnWatchSuccess());
    }

    await this.next();

    if (!this.watch) {
      await this.createSlsEnter();

      const processArgs = this.getProcessArgs();
      shell.exec(`${this.binaryToRun} ${processArgs.join(" ")}`, {
        cwd: this.cacheDir,
        env: this.processEnv,
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
      await this.createSlsEnter();

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
      env: this.processEnv,
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
    if (this.inspect) {
      let inspect = "--inspect";
      if (isString(this.inspect)) {
        inspect += "=" + this.inspect;
      }
      processArgs.unshift(inspect);
    }
    return processArgs;
  }

  private async createSlsEnter() {
    if (this.startupFile != START_DEV_FILE_NAME) {
      return;
    }

    const isSls =
      this.depsService.getDeps(
        path.join(process.cwd(), "package.json"),
        (dep) =>
          slsPackages.filter((item) => `@ipare/${item}` == dep).length > 0,
        undefined,
        false
      ).length > 0;
    if (!isSls) return;

    await fs.promises.copyFile(
      path.join(__dirname, "../sls.js"),
      path.resolve(process.cwd(), this.cacheDir, START_DEV_FILE_NAME)
    );
  }
}

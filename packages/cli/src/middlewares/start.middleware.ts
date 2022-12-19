import { isString, Middleware } from "@ipare/core";
import { Inject } from "@ipare/inject";
import path from "path";
import * as fs from "fs";
import { TsconfigService } from "../services/build.services/tsconfig.service";
import spawn from "cross-spawn";
import killProcess from "tree-kill";
import { treeKillSync } from "../utils/tree-kill";
import shell from "shelljs";
import { ConfigService } from "../services/build.services/config.service";
import { ChildProcess } from "child_process";
import { DepsService } from "../services/deps.service";

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
  private get processEnv(): NodeJS.ProcessEnv {
    const result: NodeJS.ProcessEnv = {
      NODE_ENV: this.configService.mode,
      IPARE_ENV: "http",
    };
    if (this.port) {
      result.IPARE_DEBUG_PORT = this.port;
    }
    return result;
  }

  override async invoke(): Promise<void> {
    if (this.watch) {
      this.ctx.bag("onWatchSuccess", this.createOnWatchSuccess());
    }

    await this.next();

    if (!this.watch) {
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
    let outputFilePath = this.getStartFilePath();
    let childProcessArgs: string[] = [];
    const argsStartIndex = process.argv.indexOf("--");
    if (argsStartIndex >= 0) {
      childProcessArgs = process.argv.slice(argsStartIndex + 1);
    }
    outputFilePath = outputFilePath.includes(" ")
      ? `"${outputFilePath}"`
      : outputFilePath;

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

  private getStartFilePath() {
    const startupFile = this.configService.getOptionOrConfigValue<string>(
      "startupFile",
      "startu.startupFile"
    );
    if (startupFile) {
      const targetFile = path.resolve(this.cacheDir, startupFile);
      if (fs.existsSync(targetFile)) {
        return startupFile;
      } else if (
        !targetFile.endsWith(".js") &&
        fs.existsSync(targetFile + ".js")
      ) {
        return startupFile + ".js";
      } else if (
        targetFile.endsWith(".ts") &&
        fs.existsSync(targetFile.replace(/\.ts$/, ".js"))
      ) {
        return startupFile.replace(/\.ts$/, ".js");
      } else {
        throw new Error("Can't find startup file");
      }
    }

    const files = ["native", "index", "main"];
    for (const file of files) {
      const filePath = path.resolve(process.cwd(), this.cacheDir, `${file}.js`);
      if (fs.existsSync(filePath)) {
        return filePath;
      }
    }

    throw new Error("The start file is not exist");
  }
}

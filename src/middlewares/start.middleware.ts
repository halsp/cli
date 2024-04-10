import { isString, Middleware } from "@halsp/core";
import { Inject } from "@halsp/inject";
import path from "path";
import * as fs from "fs";
import spawn from "cross-spawn";
import killProcess from "tree-kill";
import { treeKillSync } from "../utils/tree-kill";
import { ConfigService } from "../services/build.services/config.service";
import { ChildProcess } from "child_process";
import { FileService } from "../services/file.service";
import { RunnerService } from "../services/runner.service";

export class StartMiddleware extends Middleware {
  @Inject
  private readonly configService!: ConfigService;
  @Inject
  private readonly fileService!: FileService;
  @Inject
  private readonly runnerService!: RunnerService;

  private get cacheDir() {
    return this.configService.cacheDir;
  }
  private get inspect() {
    return this.configService.getOptionOrConfigValue<boolean | string>(
      "inspect",
      "start.inspect",
      false,
    );
  }
  private get port() {
    return this.configService.getOptionOrConfigValue<string>(
      "port",
      "start.port",
    );
  }
  private get watch() {
    return this.configService.getOptionOrConfigValue<boolean>(
      "watch",
      "build.watch",
    );
  }
  private get binaryToRun() {
    return this.configService.getOptionOrConfigValue<string>(
      "binaryToRun",
      "start.binaryToRun",
      "node",
    );
  }
  private get processEnv(): NodeJS.ProcessEnv {
    const result: NodeJS.ProcessEnv = {
      ...process.env,
      NODE_ENV: this.configService.mode,
      HALSP_ENV: "http",
    };
    if (this.port) {
      result.HALSP_DEBUG_PORT = this.port;
    }
    return result;
  }

  override async invoke(): Promise<void> {
    let createOnWatchStoped!: () => void;
    let watchPromise!: Promise<void>;
    if (this.watch) {
      watchPromise = new Promise<void>((resolve) => {
        createOnWatchStoped = () => resolve();
      });
      this.ctx.set("onWatchSuccess", this.createOnWatchSuccess());
      this.ctx.set("onWatchStoped", createOnWatchStoped);
    }

    await this.next();

    if (this.watch) {
      await watchPromise;
    } else {
      const processArgs = this.getProcessArgs();
      this.runnerService.run(this.binaryToRun, processArgs, {
        cwd: this.cacheDir,
        env: this.processEnv,
      });
    }
  }

  private createOnWatchSuccess() {
    let childProcessRef: ChildProcess | undefined;
    process.on(
      "exit",
      () => childProcessRef?.pid && treeKillSync(childProcessRef.pid),
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
    let startupFile = this.getStartFilePathFromOptions();
    if (startupFile) return startupFile;

    const fiels = ["native", "index", "main"].reduce<string[]>((pre, file) => {
      [".js", ".mjs", ".cjs"].forEach((ext) =>
        pre.push(path.resolve(this.cacheDir, file + ext)),
      );
      return pre;
    }, []);
    startupFile = this.fileService.existAny(fiels);
    if (startupFile) return startupFile;

    throw new Error("The start file is not exist");
  }

  private getStartFilePathFromOptions() {
    const startupFile = this.configService.getOptionOrConfigValue<string>(
      "startupFile",
      "startu.startupFile",
    );
    if (!startupFile) return;

    const targetFile = path.resolve(this.cacheDir, startupFile);
    if (fs.existsSync(targetFile)) {
      return startupFile;
    }

    if (!targetFile.match(/\.(c|e)?(j|t)s$/)) {
      for (const ext of [".js", ".cjs", ".mjs"]) {
        if (fs.existsSync(targetFile + ext)) {
          return startupFile + ext;
        }
      }
    }

    if (targetFile.match(/\.(c|e)?ts$/)) {
      const newName = targetFile.replace(/ts$/, "js");
      if (fs.existsSync(newName)) {
        return newName;
      }
    }

    throw new Error("Can't find the startup file: " + startupFile);
  }
}

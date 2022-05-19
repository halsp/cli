import { isUndefined, Middleware } from "@sfajs/core";
import { Inject } from "@sfajs/inject";
import path from "path";
import * as fs from "fs";
import { ConfigService } from "../services/config.service";
import { TsconfigService } from "../services/tsconfig.service";
import { spawn } from "child_process";
import killProcess from "tree-kill";
import { CommandService } from "../services/command.service";
import { START_DEV_FILE_NAME } from "../constant";
import { treeKillSync } from "../utils/tree-kill";

// TODO: remove dist
export class StartMiddleware extends Middleware {
  @Inject
  private readonly tsconfigService!: TsconfigService;
  @Inject
  private readonly configService!: ConfigService;
  @Inject
  private readonly commandService!: CommandService;

  private get outDir() {
    return this.tsconfigService.outDir;
  }
  private get debug() {
    return this.commandService.getOptionOrConfigValue<boolean>(
      "debug",
      "build.debug",
      false
    );
  }
  private get mode() {
    return this.commandService.getOptionOrConfigValue<string>(
      "mode",
      "mode",
      "production"
    );
  }
  private get enterFile() {
    const result = this.commandService.getOptionOrConfigValue<string>(
      "entryFile",
      "entryFile",
      START_DEV_FILE_NAME
    );
    if (result.includes(".")) {
      return result;
    } else {
      return result + ".js";
    }
  }
  private get port() {
    return this.commandService.getOptionOrConfigValue<string>(
      "port",
      "start.port",
      "2333"
    );
  }

  async invoke(): Promise<void> {
    this.ctx.res.setBody({
      onWatchSuccess: this.createOnSuccessHook(),
    });

    await this.next();
  }

  private createOnSuccessHook(binaryToRun = "node") {
    let childProcessRef: any;
    process.on(
      "exit",
      () => childProcessRef && treeKillSync(childProcessRef.pid)
    );

    return () => {
      if (isUndefined(this.ctx.commandOptions["enterFile"])) {
        this.copyEnterFile();
      }

      if (childProcessRef) {
        childProcessRef.removeAllListeners("exit");
        childProcessRef.on("exit", () => {
          childProcessRef = this.spawnChildProcess(binaryToRun);
          childProcessRef.on("exit", () => (childProcessRef = undefined));
        });

        childProcessRef.stdin && childProcessRef.stdin.pause();
        killProcess(childProcessRef.pid);
      } else {
        childProcessRef = this.spawnChildProcess(binaryToRun);
        childProcessRef.on("exit", (code: number) => {
          process.exitCode = code;
          childProcessRef = undefined;
        });
      }
    };
  }

  private spawnChildProcess(binaryToRun: string) {
    let outputFilePath = path.resolve(
      process.cwd(),
      this.outDir,
      this.enterFile
    );
    if (!fs.existsSync(outputFilePath)) {
      throw new Error("Can't find enter file");
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
    if (this.isSourceMapSupportPkgAvailable()) {
      processArgs.unshift("-r source-map-support/register");
    }

    return spawn(binaryToRun, processArgs, {
      stdio: "inherit",
      shell: true,
      cwd: this.outDir,
    });
  }

  private isSourceMapSupportPkgAvailable() {
    try {
      require.resolve("source-map-support");
      return true;
    } catch {
      return false;
    }
  }

  private copyEnterFile() {
    let code = fs.readFileSync(
      path.join(__dirname, "../utils/run-startup.js"),
      "utf-8"
    );
    code = code.replace("{{MODE}}", this.mode);
    code = code.replace("{{PORT}}", this.port);
    fs.writeFileSync(
      path.resolve(process.cwd(), this.outDir, START_DEV_FILE_NAME),
      code
    );
  }
}

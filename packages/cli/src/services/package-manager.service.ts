import { Inject } from "@sfajs/inject";
import chalk from "chalk";
import { ChildProcess, spawn, SpawnOptions } from "child_process";
import inquirer from "inquirer";
import { LoadingService } from "./loading.service";

export class PackageManagerService {
  @Inject
  private readonly loadingService!: LoadingService;

  public async pickPackageManager(): Promise<string> {
    const { mng } = await inquirer.prompt([
      {
        type: "list",
        message:
          "Pick the package manager to use when installing dependencies:",
        name: "mng",
        default: "yarn",
        choices: [
          {
            name: "Use Yarn",
            value: "yarn",
          },
          {
            name: "Use NPM",
            value: "npm",
          },
          {
            name: "Use PNPM",
            value: "pnpm",
          },
          {
            name: "Use CNPM",
            value: "cnpm",
          },
        ],
      },
    ]);
    return mng;
  }

  public async run(
    pm: string,
    command: string,
    cwd: string = process.cwd()
  ): Promise<boolean> {
    const args: string[] = [command];
    const options: SpawnOptions = {
      cwd,
      stdio: "inherit",
      shell: true,
    };
    return new Promise<boolean>((resolve) => {
      const child: ChildProcess = spawn(pm, args, options);
      child.on("close", (code) => {
        resolve(!code);
      });
    });
  }

  public async install(pm: string, dir: string) {
    this.loadingService.start(`Installation in progress...`);
    const runResult = await this.run(pm, "install", dir);
    if (!runResult) {
      this.loadingService.fail("Installation failed");
      return false;
    }

    this.loadingService.succeed();
    console.info(`Installation complete`);
    return true;
  }
}

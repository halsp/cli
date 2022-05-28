import { Inject } from "@sfajs/inject";
import chalk from "chalk";
import { ChildProcess, spawn, SpawnOptions } from "child_process";
import inquirer from "inquirer";
import { PackageManager } from "../configuration";
import { LoadingService } from "./loading.service";

export class PackageManagerService {
  @Inject
  private readonly loadingService!: LoadingService;

  public async pickPackageManager(): Promise<PackageManager> {
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
    pm: PackageManager,
    command: string,
    cwd: string = process.cwd()
  ): Promise<null | string> {
    const args: string[] = [command];
    const options: SpawnOptions = {
      cwd,
      stdio: "pipe",
      shell: true,
    };
    return new Promise<null | string>((resolve, reject) => {
      const child: ChildProcess = spawn(pm, args, options);
      child.stdout?.on("data", (data) => resolve(data));
      child.on("close", (code) => {
        if (code === 0) {
          resolve(null);
        } else {
          console.error(chalk.red(`\nFailed to execute command: ${command}`));
          reject();
        }
      });
    });
  }

  public async install(pm: PackageManager, dir: string) {
    this.loadingService.start(`Installation in progress...`);
    try {
      await this.run(pm, "install", dir);
      this.loadingService.succeed();
      console.info("Installation is complete");
    } catch {
      this.loadingService.fail();
    }
  }
}

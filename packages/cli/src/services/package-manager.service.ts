import { Inject } from "@sfajs/inject";
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
        default: "npm",
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
    return await this.run(pm, "install", dir);
  }
}

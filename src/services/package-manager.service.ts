import { Inject } from "@ipare/inject";
import inquirer from "inquirer";
import { RunnerService } from "./runner.service";

export class PackageManagerService {
  @Inject
  private readonly runnerService!: RunnerService;

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

  public async install(pm: string, dir = process.cwd()) {
    return await this.runnerService.run(pm, "install", {
      cwd: dir,
    });
  }
}

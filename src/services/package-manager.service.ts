import { Inject } from "@ipare/inject";
import inquirer from "inquirer";
import { CommandService } from "./command.service";
import { RunnerService } from "./runner.service";

export class PackageManagerService {
  @Inject
  private readonly runnerService!: RunnerService;
  @Inject
  private readonly commandService!: CommandService;

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

  public install(pm: string, dir = process.cwd()) {
    const args: string[] = ["install"];
    const registry = this.commandService.getOptionVlaue<string>("registry");
    if (registry) {
      args.push("--registry");
      args.push(registry);
    }

    return this.runnerService.run(pm, args, {
      cwd: dir,
      encoding: "utf-8",
    });
  }
}

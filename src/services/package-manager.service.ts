import { Inject } from "@halsp/inject";
import { CommandService } from "./command.service";
import { InquirerService } from "./inquirer.service";
import { RunnerService } from "./runner.service";

export class PackageManagerService {
  @Inject
  private readonly runnerService!: RunnerService;
  @Inject
  private readonly commandService!: CommandService;
  @Inject
  private readonly inquirerService!: InquirerService;

  private packageManager?: string;
  public async get(): Promise<string> {
    if (!this.packageManager) {
      let pm = this.commandService.getOptionVlaue<string>("packageManager");
      if (!pm) {
        pm = await this.pick();
      }
      this.packageManager = pm;
    }

    return this.packageManager;
  }

  private async pick(): Promise<string> {
    const { mng } = await this.inquirerService.prompt([
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

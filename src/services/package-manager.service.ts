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

  public async exec(args: string | string[], pm?: string, dir = process.cwd()) {
    args = Array.isArray(args) ? [...args] : [args];

    const registry = this.commandService.getOptionVlaue<string>("registry");
    if (registry) {
      args.push("--registry");
      args.push(registry);
    }

    pm ||= await this.get();
    return this.runnerService.run(pm, args, {
      cwd: dir,
      encoding: "utf-8",
    });
  }

  public async install(pm?: string, dir = process.cwd()) {
    return await this.exec("install", pm, dir);
  }

  public async add(name: string, pm?: string, dir = process.cwd()) {
    return await this.exec(["add", name], pm, dir);
  }

  public async uninstall(name: string, dir = process.cwd()) {
    return await this.exec(["uninstall", name], "npm", dir);
  }
}

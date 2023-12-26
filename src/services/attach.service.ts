import { Inject } from "@halsp/inject";
import path from "path";
import fs from "fs";
import { DepsService } from "./deps.service";
import { Command } from "commander";
import { HALSP_CLI_PLUGIN_ATTACH } from "../constant";
import { RunnerService } from "./runner.service";

type AttachHook = (command: Command) => void;
interface AttachConfig {
  register: AttachHook;
  baseOn: string | string[];
}

export class AttachService {
  @Inject
  private readonly depsService!: DepsService;
  @Inject
  private readonly runnerService!: RunnerService;

  public get cacheDir() {
    return path.join(__dirname, "../../node_modules/.halsp.attach");
  }

  public async get() {
    await this.init();

    const list = await this.depsService.getPlugins<AttachConfig>(
      HALSP_CLI_PLUGIN_ATTACH,
      this.cacheDir,
    );

    return list
      .map((item) => ({
        package: item.package,
        config: item.interface,
      }))
      .reduce<
        {
          package: string;
          config: AttachConfig;
        }[]
      >((pre, cur) => {
        if (!pre.filter((p) => p.package == cur.package).length) {
          pre.push(cur);
        }
        return pre;
      }, []);
  }

  private async init() {
    if (fs.existsSync(path.join(this.cacheDir, "package.json"))) {
      return;
    }

    await fs.promises.mkdir(this.cacheDir, { recursive: true });
    this.runnerService.run("npm", ["init", "-y"], {
      cwd: this.cacheDir,
      encoding: "utf-8",
    });
  }
}

export function getAttachsWithOut() {
  const service = new AttachService();
  Object.defineProperty(service, "depsService", {
    value: new DepsService(),
  });
  Object.defineProperty(service, "runnerService", {
    value: new RunnerService(),
  });
  return service.get();
}

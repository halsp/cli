import { Inject } from "@halsp/inject";
import path from "path";
import { DepsService } from "./deps.service";
import { Command } from "commander";
import { HALSP_CLI_PLUGIN_ATTACH } from "../constant";

type AttachHook = (command: Command) => void;
interface AttachConfig {
  register: AttachHook;
  baseOn: string | string[];
}

export class AttachService {
  @Inject
  private readonly depsService!: DepsService;

  public async get() {
    const pkgPath = path.join(__dirname, "../..");
    const localList = (
      await this.depsService.getPlugins<AttachConfig>(
        HALSP_CLI_PLUGIN_ATTACH,
        pkgPath,
      )
    ).map((item) => ({
      ...item,
      cwd: false,
    }));
    const currentList = (
      await this.depsService.getPlugins<AttachConfig>(
        HALSP_CLI_PLUGIN_ATTACH,
        undefined,
      )
    ).map((item) => ({
      ...item,
      cwd: true,
    }));

    return [...localList, ...currentList]
      .map((item) => ({
        package: item.package,
        cwd: item.cwd,
        config: item.interface,
      }))
      .reduce<
        {
          package: string;
          config: AttachConfig;
          cwd: boolean;
        }[]
      >((pre, cur) => {
        if (!pre.filter((p) => p.package == cur.package).length) {
          pre.push(cur);
        }
        return pre;
      }, []);
  }
}

export function getAttachsWithOut() {
  const service = new AttachService();
  Object.defineProperty(service, "depsService", {
    value: new DepsService(),
  });
  return service.get();
}

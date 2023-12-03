import { Inject } from "@halsp/inject";
import path from "path";
import { DepsService } from "./deps.service";
import { Command } from "commander";

type PluginHook = (command: Command) => void;

export class PluginService {
  @Inject
  private readonly depsService!: DepsService;

  public get() {
    const pkgPath = path.join(__dirname, "../../package.json");
    const localList = this.depsService
      .getInterfaces<PluginHook>("cliPluginHook", pkgPath, true)
      .map((item) => ({
        ...item,
        cwd: false,
      }));
    const currentList = this.depsService
      .getInterfaces<PluginHook>("cliPluginHook", undefined, true)
      .map((item) => ({
        ...item,
        cwd: true,
      }));

    return [...localList, ...currentList]
      .reduce<
        {
          package: string;
          interface: PluginHook;
          cwd: boolean;
        }[]
      >((pre, cur) => {
        if (!pre.filter((p) => p.package == cur.package).length) {
          pre.push(cur);
        }
        return pre;
      }, [])
      .sort((left, right) => {
        if (left.package == "@halsp/cli") {
          return -1;
        }
        if (right.package == "@halsp/cli") {
          return -1;
        }
        return 0;
      });
  }
}

export function getPluginsWithOut() {
  const service = new PluginService();
  Object.defineProperty(service, "depsService", {
    value: new DepsService(),
  });
  return service.get();
}

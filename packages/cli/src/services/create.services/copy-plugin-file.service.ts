import { Inject } from "@ipare/inject";
import path from "path";
import glob from "glob";
import { PluginConfigService } from "./plugin-config.service";

export class CopyPluginFileService {
  @Inject
  private readonly pluginConfigService!: PluginConfigService;

  private get sourceDir() {
    return path.join(__dirname, "../../../template");
  }

  public async copy(plugins: string[]) {
    const { files } = await this.pluginConfigService.getSortedConfig(plugins);
    const result: string[] = [];
    for (const excludes in files) {
      if (files[excludes]) {
        continue;
      }

      const paths = glob.sync(excludes, {
        cwd: this.sourceDir,
        dot: true,
        nodir: true,
      });
      result.push(...paths);
    }
    return result;
  }
}

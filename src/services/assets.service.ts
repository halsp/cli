import { Inject } from "@sfajs/inject";
import path from "path";
import { CommandService } from "./command.service";
import { FileService } from "./file.service";
import { TsconfigService } from "./tsconfig.service";
import * as chokidar from "chokidar";
import * as fs from "fs";

export class AssetsService {
  @Inject
  private readonly tsconfigService!: TsconfigService;
  @Inject
  private readonly commandService!: CommandService;
  @Inject
  private readonly fileService!: FileService;

  private readonly watchers: chokidar.FSWatcher[] = [];

  private get assets(): string[] {
    let ass = this.commandService.getOptionOrConfigValue<string, string[]>(
      "assets",
      "build.assets"
    );
    if (!ass) return [];

    if (typeof ass == "string") {
      ass = ass.split(",");
    }
    return ass;
  }
  private get outDir() {
    return this.tsconfigService.outDir;
  }
  private get watch() {
    return this.commandService.getOptionOrConfigValue<boolean>(
      "watch",
      "build.watch",
      false
    );
  }
  private get watchAssets() {
    return this.commandService.getOptionOrConfigValue<boolean>(
      "watchAssets",
      "build.watchAssets",
      this.watch
    );
  }

  public async stopWatch() {
    await Promise.all(this.watchers.map((watcher) => watcher.close()));
  }

  public copy() {
    if (!this.assets.length) return;

    for (const asset of this.assets) {
      if (this.watchAssets) {
        this.watchAsset(asset);
      } else {
        this.fileService.copyFile(asset, this.getTargetPath(asset));
      }
    }
  }

  private watchAsset(asset: string) {
    const onChange = (filePath: string) => {
      const targetPath = this.getTargetPath(filePath);
      const dirname = path.dirname(targetPath);
      if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname, {
          recursive: true,
        });
      }
      fs.copyFileSync(filePath, targetPath);
    };
    const onUnlink = (filePath: string) => {
      fs.unlinkSync(this.getTargetPath(filePath));
    };

    const watcher = chokidar
      .watch(asset)
      .on("add", onChange)
      .on("change", onChange)
      .on("unlink", onUnlink);
    this.watchers.push(watcher);
  }

  private getTargetPath(asset: string) {
    return path.join(this.outDir, asset);
  }
}

import { Inject } from "@halsp/inject";
import path from "path";
import * as chokidar from "chokidar";
import * as fs from "fs";
import { AssetConfig } from "../../configuration";
import { glob } from "glob";
import { FileService } from "../file.service";
import { ConfigService } from "./config.service";
import { Context } from "@halsp/core";
import { CommandService } from "../command.service";

type SortedAsset = {
  include: string;
  exclude: string[];
  outDir: string;
  root: string;
};

export class AssetsService {
  @Inject
  private readonly configService!: ConfigService;
  @Inject
  private readonly commandService!: CommandService;
  @Inject
  private readonly fileService!: FileService;
  @Inject
  private readonly ctx!: Context;

  private readonly watchers: chokidar.FSWatcher[] = [];

  public get assets(): SortedAsset[] {
    const commandAssets = this.commandService.getOptionVlaue<string>(
      "assets",
      ""
    );
    const configAssets = this.configService.getConfigValue<AssetConfig[]>(
      "build.assets",
      []
    );
    const assets: AssetConfig[] = [];
    if (commandAssets) {
      assets.push(...commandAssets.split("||"));
    }
    assets.push(...configAssets);

    const result: SortedAsset[] = [];
    assets
      .map((asset) => {
        if (typeof asset == "string") {
          return {
            include: asset,
          };
        } else {
          return asset;
        }
      })
      .filter((asset) => !!asset.include)
      .filter((asset) => !!asset.include.length)
      .map((asset) => {
        let exclude = asset.exclude ?? [];
        if (typeof exclude == "string") {
          exclude = [exclude];
        }

        const outDir = path.resolve(this.cacheDir, asset.outDir ?? "");
        const root = path.resolve(asset.root ?? process.cwd());

        return {
          include: asset.include,
          exclude,
          outDir,
          root,
        };
      })
      .forEach((asset) => {
        if (typeof asset.include == "string") {
          result.push({
            ...asset,
            include: asset.include,
          });
        } else {
          for (const item of asset.include) {
            result.push({
              ...asset,
              include: item,
            });
          }
        }
      });
    return result;
  }

  private get cacheDir() {
    return this.configService.cacheDir;
  }
  private get watch() {
    return this.configService.getOptionOrConfigValue<boolean>(
      "watch",
      "build.watch",
      this.ctx.command == "start"
    );
  }
  private get watchAssets() {
    return this.configService.getOptionOrConfigValue<boolean>(
      "watchAssets",
      "build.watchAssets",
      this.watch
    );
  }

  public async stopWatch() {
    await Promise.all(this.watchers.map((watcher) => watcher.close()));
  }

  public async copy() {
    if (!this.assets.length) return;

    for (const asset of this.assets) {
      if (this.watchAssets) {
        this.watchAsset(asset);
      } else {
        await this.globCopy(asset);
      }
    }
  }

  private async globCopy(asset: SortedAsset) {
    const paths = await glob(asset.include, {
      ignore: asset.exclude,
      cwd: asset.root,
      dot: true,
      nodir: true,
    });
    for (const p of paths) {
      const sourceFile = path.join(asset.root, p);
      const targetFile = path.join(asset.outDir, p);

      await this.fileService.createDir(targetFile);
      await fs.promises.copyFile(sourceFile, targetFile);
    }
  }

  private watchAsset(asset: SortedAsset) {
    const getTargetPath = (file: string) => {
      return path.join(asset.outDir, file);
    };
    const getSourcePath = (file: string) => {
      return path.join(asset.root, file);
    };
    const onChange = async (filePath: string) => {
      const targetPath = getTargetPath(filePath);
      const sourcePath = getSourcePath(filePath);
      await this.fileService.createDir(targetPath);
      await fs.promises.copyFile(sourcePath, targetPath);
    };
    const onUnlink = async (filePath: string) => {
      const targetPath = getTargetPath(filePath);
      await fs.promises.unlink(targetPath);
    };

    const watcher = chokidar
      .watch(asset.include, {
        ignored: asset.exclude,
        cwd: asset.root,
      })
      .on("add", onChange)
      .on("change", onChange)
      .on("unlink", onUnlink);
    this.watchers.push(watcher);
  }
}

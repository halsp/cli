import { HttpContext } from "@sfajs/core";
import * as ts from "typescript";
import { CommandType } from "./utils/command-type";

type Transformer = ts.TransformerFactory<any> | ts.CustomTransformerFactory;

export type Prebuild = (
  ctx: HttpContext
) => Promise<boolean> | boolean | Promise<void> | void;
export type Postbuild = (ctx: HttpContext) => Promise<void> | void;
export type AssetConfig =
  | {
      include: string | string[];
      exclude?: string | string[];
      outDir?: string;
      root?: string;
    }
  | string;
export type ConfigEnv = {
  mode: string;
  dirname: string;
  command: CommandType;
};

export type PackageManager = "yarn" | "npm" | "pnpm" | "cnpm";

export interface Configuration {
  readonly build?: {
    readonly prebuild?: Prebuild[];
    readonly postbuild?: Postbuild[];

    readonly beforeHooks?: ((program?: ts.Program) => Transformer)[];
    readonly afterHooks?: ((program?: ts.Program) => Transformer)[];
    readonly afterDeclarationsHooks?: ((program?: ts.Program) => Transformer)[];

    readonly deleteOutDir?: boolean;
    readonly assets?: AssetConfig[];

    readonly watch?: boolean;
    readonly watchAssets?: boolean;

    readonly tsConfigPath?: string;
  };
  readonly start?: {
    readonly port?: number;
  };
  readonly startupFile?: string;
  readonly packageManager?: string;
}

export interface ConfigurationOptions {
  configFile?: string;
  tsConfigFile?: string;
  mode?: string;
}

export function defineConfig(
  config: Configuration
): (options: ConfigEnv) => Configuration;
export function defineConfig(
  config: (options: ConfigEnv) => Configuration
): (options: ConfigEnv) => Configuration;
export function defineConfig(
  config: Configuration | ((options: ConfigEnv) => Configuration)
): (options: ConfigEnv) => Configuration {
  if (typeof config == "function") {
    return config;
  } else {
    return () => config;
  }
}

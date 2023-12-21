import type ts from "typescript";

export type CommandType =
  | "build"
  | "create"
  | "info"
  | "start"
  | "template"
  | "update";

export type AssetConfig =
  | {
      include: string | string[];
      exclude?: string | string[];
      outDir?: string;
      root?: string;
    }
  | string;

export type ScriptOptions = {
  config: Configuration;
  cacheDir: string;
} & ConfigEnv;

export type Prebuild = (
  options: ScriptOptions,
) => Promise<boolean> | boolean | Promise<void> | void;
export type Postbuild = (options: ScriptOptions) => Promise<void> | void;

export interface ConfigEnv {
  mode: string;
  command: CommandType;
  commandArgs: Record<string, string>;
  commandOptions: Record<string, string | boolean>;
}

export interface Configuration {
  build?: {
    prebuild?: Prebuild[];
    postbuild?: Postbuild[];

    transformers?: (program: ts.Program) => ts.CustomTransformers;

    deleteOutDir?: boolean;
    assets?: AssetConfig[];

    watch?: boolean;
    watchAssets?: boolean;
    preserveWatchOutput?: boolean;

    sourceMap?: boolean;
    copyPackage?: boolean;
    removeDevDeps?: boolean;

    cacheDir?: string;
    moduleType?: "cjs" | "mjs";
  };
  start?: {
    port?: number;
    binaryToRun?: string;
    inspect?: boolean | string;
    startupFile?: string;
  };
}

export function defineConfig(
  config: Configuration,
): (options: ConfigEnv) => Configuration;
export function defineConfig(
  config: (options: ConfigEnv) => Configuration,
): (options: ConfigEnv) => Configuration;
export function defineConfig(
  config: Configuration | ((options: ConfigEnv) => Configuration),
): (options: ConfigEnv) => Configuration {
  if (typeof config == "object") {
    return () => config;
  } else {
    return config;
  }
}

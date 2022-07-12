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
export type Transformer<T extends ts.Node> =
  | ts.TransformerFactory<T>
  | ts.CustomTransformerFactory;
export type CompilerHook<T extends ts.Node> = (
  program: ts.Program
) => Transformer<T>;

export type ScriptOptions = {
  config: Configuration;
  cacheDir: string;
} & ConfigEnv;

export type Prebuild = (
  options: ScriptOptions
) => Promise<boolean> | boolean | Promise<void> | void;
export type Postbuild = (options: ScriptOptions) => Promise<void> | void;

export interface ConfigEnv {
  mode: string;
  command: CommandType;
}

export interface Configuration {
  readonly build?: {
    readonly prebuild?: Prebuild[];
    readonly postbuild?: Postbuild[];

    readonly beforeHooks?: CompilerHook<ts.SourceFile>[];
    readonly afterHooks?: CompilerHook<ts.SourceFile>[];
    readonly afterDeclarationsHooks?: CompilerHook<ts.SourceFile | ts.Bundle>[];

    readonly deleteOutDir?: boolean;
    readonly assets?: AssetConfig[];

    readonly watch?: boolean;
    readonly watchAssets?: boolean;
    readonly preserveWatchOutput?: boolean;

    readonly sourceMap?: boolean;
    readonly copyPackage?: boolean;
  };
  readonly start?: {
    readonly port?: number;
    readonly binaryToRun?: string;
  };
  readonly startupFile?: string;
  readonly packageManager?: string;
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
  if (typeof config == "object") {
    return () => config;
  } else {
    return config;
  }
}

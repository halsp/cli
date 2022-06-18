import ts from "typescript";
import { Configuration, ConfigEnv } from "@sfajs/cli-common";

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
export type Transformer =
  | ts.TransformerFactory<any>
  | ts.CustomTransformerFactory;

export type ScriptOptions = {
  config: Configuration;
  cacheDir: string;
} & ConfigEnv;

export type Prebuild = (
  options: ScriptOptions
) => Promise<boolean> | boolean | Promise<void> | void;
export type Postbuild = (options: ScriptOptions) => Promise<void> | void;

declare module "@sfajs/cli-common" {
  interface ConfigEnv {
    mode: string;
    command: CommandType;
  }
  interface Configuration {
    readonly build?: {
      readonly prebuild?: Prebuild[];
      readonly postbuild?: Postbuild[];

      readonly beforeHooks?: ((program?: ts.Program) => Transformer)[];
      readonly afterHooks?: ((program?: ts.Program) => Transformer)[];
      readonly afterDeclarationsHooks?: ((
        program?: ts.Program
      ) => Transformer)[];

      readonly deleteOutDir?: boolean;
      readonly assets?: AssetConfig[];

      readonly watch?: boolean;
      readonly watchAssets?: boolean;
      readonly preserveWatchOutput?: boolean;

      readonly tsConfigPath?: string;
      readonly sourceMap?: boolean;
    };
    readonly start?: {
      readonly port?: number;
      readonly binaryToRun?: string;
    };
    readonly startupFile?: string;
    readonly packageManager?: string;
  }
}

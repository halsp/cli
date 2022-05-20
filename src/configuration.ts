import ts from "typescript";

type Transformer = ts.TransformerFactory<any> | ts.CustomTransformerFactory;

export type Prebuild = (
  config: Configuration
) => Promise<boolean> | boolean | Promise<void> | void;
export type Postbuild = (config: Configuration) => Promise<void> | void;

export interface Configuration {
  readonly build?: {
    readonly prebuild?: Prebuild[];
    readonly postbuild?: Postbuild[];

    readonly beforeHooks: ((program?: ts.Program) => Transformer)[];
    readonly afterHooks: ((program?: ts.Program) => Transformer)[];
    readonly afterDeclarationsHooks: ((program?: ts.Program) => Transformer)[];

    readonly deleteOutDir?: boolean;
    readonly assets?: string[];

    readonly watch?: boolean;
    readonly watchAssets?: boolean;
  };
  readonly start?: {
    readonly port?: number;
  };
  readonly startupFile?: string;
}

export interface ConfigurationOptions {
  configFile?: string;
  tsConfigFile?: string;
  mode?: string;
}

export function defineConfig(
  config: Configuration
): (mode: string) => Configuration;
export function defineConfig(
  config: (mode: string) => Configuration
): (mode: string) => Configuration;
export function defineConfig(
  config: Configuration | ((mode: string) => Configuration)
): (mode: string) => Configuration {
  if (typeof config == "function") {
    return config;
  } else {
    return () => config;
  }
}

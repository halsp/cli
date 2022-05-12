export type StaticItem = string | { source: string; target: string };
export type Prebuild = (
  config: Configuration
) => Promise<boolean> | boolean | Promise<void> | void;
export type Postbuild = (config: Configuration) => Promise<void> | void;

export interface Configuration {
  readonly customMethods?: readonly string[];
  readonly build?: {
    readonly prebuild?: Prebuild[];
    readonly postbuild?: Postbuild[];

    readonly deleteOutDir?: boolean;
    readonly deleteBuildFileTypes?: string[];
    readonly static?: StaticItem[];
  };
}

export * from "./define.configuration";
export * from "./load.configuration";
export * from "./options.configuration";

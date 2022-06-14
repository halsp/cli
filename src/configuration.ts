import * as ts from "typescript";
import { Postbuild, Prebuild } from "./build-scripts";
import { AssetConfig } from "./assets-config";

export type Transformer =
  | ts.TransformerFactory<any>
  | ts.CustomTransformerFactory;

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
    readonly binaryToRun?: string;
  };
  readonly startupFile?: string;
  readonly packageManager?: string;
}

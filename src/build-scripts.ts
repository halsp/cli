import * as ts from "typescript";
import { Configuration } from "./configuration";
import { ConfigEnv } from "./define-config";

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

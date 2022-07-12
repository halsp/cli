import { Inject } from "@ipare/inject";
import path from "path";
import { CompilerHook, Postbuild, Prebuild } from "../configuration";
import { DepsService } from "./deps.service";
import * as fs from "fs";
import ts from "typescript";
import { ConfigEnv, Configuration } from "@ipare/cli-config";

export class PluginInterfaceService {
  @Inject
  private readonly depsService!: DepsService;

  public get(
    name: "cliConfig"
  ): (Configuration | ((options: ConfigEnv) => Configuration))[];
  public get(name: "postbuild"): Postbuild[];
  public get(name: "prebuild"): Prebuild[];
  public get(name: "beforeCompile"): CompilerHook<ts.SourceFile>[];
  public get(name: "afterCompile"): CompilerHook<ts.SourceFile>[];
  public get(
    name: "afterCompileDeclarations"
  ): CompilerHook<ts.SourceFile | ts.Bundle>[];
  public get(name: string) {
    const pkgPath = path.join(process.cwd(), "package.json");
    if (!fs.existsSync(pkgPath)) {
      return [];
    }

    return this.depsService
      .getDeps(
        path.join(process.cwd(), "package.json"),
        /^(@ipare\/|ipare\-|@\S+\/ipare\-)/
      )
      .map((dep) => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const module = require(dep.key);
          return module[name];
        } catch (err) {
          return undefined;
        }
      })
      .filter((script) => !!script);
  }
}

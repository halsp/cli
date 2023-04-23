import { Inject } from "@halsp/inject";
import path from "path";
import { CompilerHook, Postbuild, Prebuild } from "../../configuration";
import { DepsService } from "../deps.service";
import * as fs from "fs";
import ts from "typescript";
import { Configuration, ConfigEnv } from "../../configuration";

export class PluginInterfaceService {
  @Inject
  private readonly depsService!: DepsService;

  public get(
    name: "cliConfigHook"
  ): ((config: Configuration, options: ConfigEnv) => Configuration | void)[];
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
        /^(@halsp\/|halsp\-|@\S+\/halsp\-)/
      )
      .map((dep) => {
        const depPath = require.resolve(dep.key, {
          paths: [process.cwd()],
        });
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const module = require(depPath);
        return module[name];
      })
      .filter((script) => !!script);
  }
}

import * as fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

export type DepItem = { key: string; value: string };
export type InterfaceItem<T> = {
  package: string;
  interface: T;
};

export class DepsService {
  private getDeps(
    packagePath: string,
    regExp: RegExp | ((dep: string) => boolean),
    paths = [process.cwd()],
    containsDev = true,
  ) {
    const result: DepItem[] = [];
    this.loadDeps(result, packagePath, paths, regExp, containsDev);
    return result;
  }

  private loadDeps(
    result: DepItem[],
    packagePath: string,
    paths: string[],
    regExp: RegExp | ((dep: string) => boolean),
    containsDev: boolean,
  ) {
    if (!fs.existsSync(packagePath)) return;
    const pkg = JSON.parse(fs.readFileSync(packagePath, "utf-8"));

    function getPkgs(dependencies: Record<string, string>) {
      const deps = dependencies ?? {};
      return Object.keys(deps)
        .filter(
          (name) =>
            name.startsWith("@halsp/") &&
            !result.some((exist) => exist.key == name),
        )
        .filter((name) => {
          if (typeof regExp == "function") {
            return regExp(name);
          } else {
            return regExp.test(name);
          }
        })
        .map((name) => ({
          key: name,
          value: deps[name],
        }));
    }

    const pkgs = getPkgs(pkg.dependencies);
    const devPkgs = getPkgs(pkg.devDependencies);

    result.push(...pkgs);
    if (containsDev) {
      result.push(...devPkgs);
    }

    pkgs
      .map((pkg) => this.getPackagePath(pkg.key, paths))
      .filter((pkg) => !!pkg)
      .forEach((pkg) => this.loadDeps(result, pkg!, paths, regExp, false));
  }

  private getPackagePath(pkg: string, paths = [process.cwd()]) {
    const pkgPath = path.join(pkg, "package.json");

    try {
      return _require.resolve(pkgPath, {
        paths: paths,
      });
    } catch {
      return null;
    }
  }

  public getPackageHalspDeps(pkg: string, paths = [process.cwd()]): DepItem[] {
    const pkgPath = this.getPackagePath(pkg, paths);
    if (!pkgPath) return [];

    return this.getDeps(pkgPath, /^@halsp\//, paths, false);
  }

  public getProjectHalspDeps(
    packagePath: string,
    paths = [process.cwd()],
  ): DepItem[] {
    return this.getDeps(packagePath, /^@halsp\//, paths, true);
  }

  public async getPlugins<T>(
    name: string,
    cwd = process.cwd(),
  ): Promise<InterfaceItem<T>[]> {
    const pkgPath = this.getPackagePath(cwd, [cwd]);
    if (!pkgPath) return [];

    const deps = this.getDeps(pkgPath, /^(@halsp\/|halsp\-|@\S+\/halsp\-)/, [
      cwd,
    ]);
    const scripts: InterfaceItem<T>[] = [];
    for (const dep of deps) {
      const depPath = _require.resolve(dep.key, {
        paths: [cwd],
      });
      let module: any;
      try {
        module = await import(pathToFileURL(depPath).toString());
      } catch {
        try {
          module = _require(depPath);
        } catch {
          continue;
        }
      }
      const inter = module[name];
      if (inter) {
        scripts.push({
          package: dep.key,
          interface: module[name],
        });
      }
    }
    return scripts;
  }

  public async getInterfaces<T>(name: string, cwd = process.cwd()) {
    const plugins = await this.getPlugins<T>(name, cwd);
    return plugins.map((p) => p.interface);
  }
}

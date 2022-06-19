import * as fs from "fs";

export type DepItem = { key: string; value: string };

export class DepsService {
  public getPackageSfaDeps(pkg: string, paths = [process.cwd()]): DepItem[] {
    const path = this.getPackagePath(pkg, paths);
    return this.getDeps(path, /^@sfajs\//, paths, false);
  }

  public getProjectSfaDeps(
    packagePath: string,
    paths = [process.cwd()]
  ): DepItem[] {
    return this.getDeps(packagePath, /^@sfajs\//, paths, true);
  }

  public getDeps(
    packagePath: string,
    regExp: RegExp | ((dep: string) => boolean),
    paths = [process.cwd()],
    containsDev = true
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
    containsDev: boolean
  ) {
    const pkg = JSON.parse(fs.readFileSync(packagePath, "utf-8"));

    function getPkgs(dependencies: Record<string, string>) {
      const deps = dependencies ?? {};
      return Object.keys(deps)
        .filter(
          (name) =>
            name.startsWith("@sfajs/") &&
            !result.some((exist) => exist.key == name)
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

    pkgs.forEach((pkg) => {
      const depPackagePath = this.getPackagePath(pkg.key, paths);
      this.loadDeps(result, depPackagePath, paths, regExp, false);
    });
  }

  private getPackagePath(pkg: string, paths = [process.cwd()]) {
    return require.resolve(pkg + "/package.json", {
      paths: paths,
    });
  }
}

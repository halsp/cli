import * as fs from "fs";

export type DepItem = { key: string; value: string };

export class DepsService {
  public getPackageSfaDeps(pkg: string, paths = [process.cwd()]): DepItem[] {
    const path = this.getPackagePath(pkg, paths);
    return this.getSfaDeps(path, paths, false);
  }

  public getProjectSfaDeps(
    packagePath: string,
    paths = [process.cwd()]
  ): DepItem[] {
    return this.getSfaDeps(packagePath, paths, true);
  }

  private getSfaDeps(
    packagePath: string,
    paths: string[],
    containsDev: boolean
  ) {
    const result: DepItem[] = [];
    this.loadSfaDeps(result, packagePath, paths, containsDev);
    return result;
  }

  private loadSfaDeps(
    result: DepItem[],
    packagePath: string,
    paths: string[],
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
      this.loadSfaDeps(result, depPackagePath, paths, false);
    });
  }

  public getPackagePath(pkg: string, paths = [process.cwd()]) {
    return require.resolve(pkg + "/package.json", {
      paths: paths,
    });
  }
}

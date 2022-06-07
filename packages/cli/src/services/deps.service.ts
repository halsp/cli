import * as fs from "fs";

export type DepItem = { key: string; value: string };

export class DepsService {
  public getPackageSfaDeps(
    pkg: string,
    paths = [process.cwd()],
    containsDev = false,
    containsChildDev = false
  ): DepItem[] {
    const path = this.getPackagePath(pkg, paths);
    return this.getSfaDeps(path, [], paths, containsDev, containsChildDev);
  }

  public getProjectSfaDeps(
    packagePath: string,
    paths = [process.cwd()],
    containsDev = true,
    containsChildDev = true
  ): DepItem[] {
    return this.getSfaDeps(
      packagePath,
      [],
      paths,
      containsDev,
      containsChildDev
    );
  }

  private getSfaDeps(
    packagePath: string,
    parentResult: DepItem[],
    paths: string[],
    containsDev: boolean,
    containsChildDev: boolean
  ) {
    const result: DepItem[] = [];
    const pkg = JSON.parse(fs.readFileSync(packagePath, "utf-8"));

    function getPkgs(dependencies: Record<string, string>) {
      const deps = dependencies ?? {};
      return Object.keys(deps)
        .filter(
          (name) =>
            name.startsWith("@sfajs/") &&
            !parentResult.some((exist) => exist.key == name)
        )
        .map((name) => ({
          key: name,
          value: deps[name],
        }));
    }

    const pkgs = getPkgs(pkg.dependencies);
    if (containsDev) {
      pkgs.push(...getPkgs(pkg.devDependencies));
    }

    result.push(...pkgs);

    pkgs.forEach((pkg) => {
      const depPackagePath = this.getPackagePath(pkg.key, paths);
      result.push(
        ...this.getSfaDeps(
          depPackagePath,
          result,
          paths,
          containsChildDev,
          containsChildDev
        )
      );
    });
    return result;
  }

  public getPackagePath(pkg: string, paths = [process.cwd()]) {
    return require.resolve(pkg + "/package.json", {
      paths: paths,
    });
  }
}

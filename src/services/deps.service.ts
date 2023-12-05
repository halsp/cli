import * as fs from "fs";
import path from "path";

export type DepItem = { key: string; value: string };

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

  public getPackageHalspDeps(pkg: string, paths = [process.cwd()]): DepItem[] {
    const path = this.getPackagePath(pkg, paths);
    return this.getDeps(path, /^@halsp\//, paths, false);
  }

  public getProjectHalspDeps(
    packagePath: string,
    paths = [process.cwd()],
  ): DepItem[] {
    return this.getDeps(packagePath, /^@halsp\//, paths, true);
  }

  public getInterfaces<T>(
    name: string,
    cwd = process.cwd(),
  ): {
    package: string;
    interface: T;
  }[] {
    const pkgPath = path.resolve(cwd, "package.json");
    if (!fs.existsSync(pkgPath)) {
      return [];
    }

    return this.getDeps(pkgPath, /^(@halsp\/|halsp\-|@\S+\/halsp\-)/, [cwd])
      .map((dep) => {
        const depPath = require.resolve(dep.key, {
          paths: [cwd],
        });
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const module = require(depPath);
        const inter = module[name];
        return inter
          ? {
              package: dep.key,
              interface: module[name],
            }
          : null;
      })
      .filter((script) => !!script)
      .map((item) => item!);
  }
}

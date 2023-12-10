import * as fs from "fs";
import path from "path";
import { createRequire } from "../utils/shims";

const require = createRequire(import.meta.url);

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

    pkgs
      .map((pkg) => this.getPackagePath(pkg.key, paths))
      .filter((pkg) => !!pkg)
      .forEach((pkg) => this.loadDeps(result, pkg!, paths, regExp, false));
  }

  private getPackagePath(pkg: string, paths = [process.cwd()]) {
    const pkgPath = path.join(pkg, "package.json");
    if (!fs.existsSync(pkgPath)) {
      return null;
    }

    return require.resolve(pkgPath, {
      paths: paths,
    });
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

  public getInterfaces<T>(
    name: string,
    cwd = process.cwd(),
  ): {
    package: string;
    interface: T;
  }[] {
    const pkgPath = this.getPackagePath(cwd, [cwd]);
    if (!pkgPath) return [];

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

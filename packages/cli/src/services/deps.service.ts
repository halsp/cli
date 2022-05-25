import * as fs from "fs";

export type DepItem = { key: string; value: string };

export class DepsService {
  public getPackageSfaDeps(pkg: string, paths = [process.cwd()]): DepItem[] {
    const path = this.getPackagePath(pkg, paths);
    return this.getSfaDeps(path, [], paths);
  }

  public getProjectSfaDeps(
    packagePath: string,
    paths = [process.cwd()]
  ): DepItem[] {
    return this.getSfaDeps(packagePath, [], paths);
  }

  private getSfaDeps(
    packagePath: string,
    parentResult: DepItem[],
    paths = [process.cwd()]
  ) {
    const result: DepItem[] = [];
    const value = JSON.parse(fs.readFileSync(packagePath, "utf-8"));
    const deps = Object.assign(
      {},
      value.dependencies ?? {},
      value.devDependencies ?? {}
    );
    const pkgs = Object.keys(deps)
      .filter(
        (name) =>
          name.startsWith("@sfajs/") &&
          !parentResult.some((exist) => exist.key == name)
      )
      .map((name) => ({
        key: name,
        value: deps[name],
      }));

    result.push(...pkgs);

    pkgs.forEach((pkg) => {
      const depPackagePath = this.getPackagePath(pkg.key, paths);
      result.push(...this.getSfaDeps(depPackagePath, result, paths));
    });
    return result;
  }

  public getPackagePath(pkg: string, paths = [process.cwd()]) {
    return require.resolve(pkg + "/package.json", {
      paths: paths,
    });
  }
}

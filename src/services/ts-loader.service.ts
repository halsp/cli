import * as ts from "typescript";

export class TsLoaderService {
  #tsBinary: typeof ts | undefined = undefined;
  get tsBinary() {
    if (this.#tsBinary == undefined) {
      try {
        const tsBinaryPath = require.resolve("typescript", {
          paths: [process.cwd(), ...this.getModulePaths()],
        });
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        this.#tsBinary = require(tsBinaryPath) as typeof ts;
      } catch {
        throw new Error(
          'TypeScript could not be found! Please, install "typescript" package.'
        );
      }
    }
    return this.#tsBinary;
  }

  private getModulePaths() {
    const modulePaths = module.paths.slice(2, module.paths.length);
    const packageDeps = modulePaths.slice(0, 3);
    return [
      ...packageDeps.reverse(),
      ...modulePaths.slice(3, modulePaths.length).reverse(),
    ];
  }
}

import { dynamicImportDefault } from "../utils/dynamic-import";
import { Chalk } from "../utils/dynamic-types/chalk";

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class ChalkService {
  async init() {
    const chalk = await dynamicImportDefault<Chalk>("chalk");

    this["__proto__"] = chalk;
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface, @typescript-eslint/no-unsafe-declaration-merging
export interface ChalkService extends Chalk {}

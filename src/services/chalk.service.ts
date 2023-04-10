import { dynamicImportDefault } from "../utils/dynamic-import";
import { Chalk } from "../utils/dynamic-types/chalk";

export class ChalkService {
  async init() {
    const chalk = await dynamicImportDefault<Chalk>("chalk");

    this["__proto__"] = chalk;
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ChalkService extends Chalk {}

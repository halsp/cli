import type Chalk from "chalk";
import { dynamicImport } from "../utils/dynamic-import";

type ChalkType = typeof Chalk;

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class ChalkService {
  async init() {
    const inquirer = await dynamicImport<typeof import("chalk")>("chalk");

    this["__proto__"] = inquirer.default;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface ChalkService extends ChalkType {}

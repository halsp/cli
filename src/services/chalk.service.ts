import type Chalk from "chalk";

type ChalkType = typeof Chalk;

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class ChalkService {
  async init() {
    const inquirer = await import("chalk");

    this["__proto__"] = inquirer.default;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface ChalkService extends ChalkType {}

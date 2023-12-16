import Inquirer from "inquirer";

type InquirerType = typeof Inquirer;

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class InquirerService {
  async init() {
    const inquirer = await import("inquirer");

    this["__proto__"] = inquirer.default;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface InquirerService extends InquirerType {}

import type Inquirer from "inquirer";
import { dynamicImport } from "../utils/dynamic-import";

type InquirerType = typeof Inquirer;

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class InquirerService {
  async init() {
    const inquirer = await dynamicImport<typeof import("inquirer")>("inquirer");

    this["__proto__"] = inquirer.default;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface InquirerService extends InquirerType {}

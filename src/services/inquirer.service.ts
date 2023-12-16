import { dynamicImportDefault } from "../utils/dynamic-import";
import Inquirer from "inquirer";

type InquirerType = typeof Inquirer;

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class InquirerService {
  async init() {
    const inquirer = await dynamicImportDefault<InquirerType>("inquirer");

    this["__proto__"] = inquirer;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface InquirerService extends InquirerType {}

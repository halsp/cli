import { dynamicImportDefault } from "../utils/dynamic-import";
import { Inquirer } from "../utils/dynamic-types/inquirer";

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class InquirerService {
  async init() {
    const inquirer = await dynamicImportDefault<Inquirer>("inquirer");

    this["__proto__"] = inquirer;
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface, @typescript-eslint/no-unsafe-declaration-merging
export interface InquirerService extends Inquirer {}

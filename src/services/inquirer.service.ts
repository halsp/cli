import { dynamicImportDefault } from "../utils/dynamic-import";
import { Inquirer } from "../utils/dynamic-types/inquirer";

export class InquirerService {
  async init() {
    const inquirer = await dynamicImportDefault<Inquirer>("inquirer");

    this["__proto__"] = inquirer;
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface InquirerService extends Inquirer {}

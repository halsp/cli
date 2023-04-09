// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
export type Inquirer = typeof import("inquirer").default;

export class InquirerService {
  #inquirer!: Inquirer;

  async init() {
    const { default: inquirer } = await import("inquirer");
    this.#inquirer = inquirer;
  }

  public get prompt(): Inquirer["prompt"] {
    return this.#inquirer.prompt.bind(this.#inquirer);
  }
}

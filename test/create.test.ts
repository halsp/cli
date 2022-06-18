import { Command } from "commander";

test(
  `create`,
  async () => {
    let argv: any;
    let options: any;
    Command.prototype.parse = function (...args: any[]) {
      argv = args[0];
      options = args[1];
      return this;
    };
    await import("../src/main");
    expect(!!argv).toBeTruthy();
    expect(!!options).toBeFalsy();
  },
  1000 * 60 * 5
);

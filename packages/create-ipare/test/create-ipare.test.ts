import { Command } from "commander";

describe("create-ipare", () => {
  it("", async () => {
    const parse = Command.prototype.parse;
    Command.prototype.parse = function () {
      return this;
    };
    require("../src/create-ipare");
    Command.prototype.parse = parse;
  });
});

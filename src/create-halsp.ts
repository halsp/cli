import { Command } from "commander";
import { CreateCommand } from "./commands/create.command";

const program = new Command("create-halsp");

program.usage("<command> [options]").version(_require("../package").version);

new CreateCommand(false).register(program);

program.parse(process.argv);

if (!program.args.length) {
  program.help();
}

export {};

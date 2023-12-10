import { Command } from "commander";
import { CreateCommand } from "./commands/create.command";
import { createRequire } from "./utils/shims";

const require = createRequire(import.meta.url);
const program = new Command("create-halsp");

program
  .usage("<command> [options]")
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  .version(require("../package").version);

new CreateCommand(false).register(program);

program.parse(process.argv);

if (!program.args.length) {
  program.help();
}

export {};

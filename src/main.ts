import { Command } from "commander";
import { InitCommand } from "@sfajs/cli";
import path from "path";

const program = new Command("create-sfa");

program
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  .version(require(path.join(__dirname, "../package")).version);

new InitCommand().register(program);

program.parse(process.argv);

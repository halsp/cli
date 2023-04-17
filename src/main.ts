import { Command } from "commander";
import { BuildCommand } from "./commands/build.command";
import { CreateCommand } from "./commands/create.command";
import { InfoCommand } from "./commands/info.command";
import { ServeCommand } from "./commands/serve.command";
import { StartCommand } from "./commands/start.command";
import { UpdateCommand } from "./commands/update.command";

const program = new Command("halsp");

program
  .usage("<command> [options]")
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  .version(require("../package").version);

new CreateCommand(true).register(program);
new BuildCommand().register(program);
new StartCommand().register(program);
new InfoCommand().register(program);
new UpdateCommand().register(program);
new ServeCommand().register(program);

program.parse(process.argv);

if (!program.args.length) {
  program.help();
}

export {};

import "@halsp/inject";
import "./compiler";
import { Command } from "commander";
import { BuildCommand } from "./commands/build.command";
import { CreateCommand } from "./commands/create.command";
import { InfoCommand } from "./commands/info.command";
import { StartCommand } from "./commands/start.command";
import { UpdateCommand } from "./commands/update.command";
import { AttachCommand } from "./commands/attach.command";
import { getAttachsWithOut } from "./services/attach.service";

const pkg = _require("../package.json");

const program = new Command("halsp")
  .usage("<command> [options]")
  .version(pkg.version, "-v, --version, -version, -V");

new CreateCommand(true).register(program);
new BuildCommand().register(program);
new StartCommand().register(program);
new InfoCommand().register(program);
new UpdateCommand().register(program);
new AttachCommand().register(program);

(async () => {
  const attachs = await getAttachsWithOut();
  attachs.forEach((p) => p.config.register(program));

  program.parse(process.argv);

  if (!program.args.length) {
    program.help();
  }
})();

export {};

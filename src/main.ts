import "@halsp/inject";
import { Command } from "commander";
import { BuildCommand } from "./commands/build.command";
import { CreateCommand } from "./commands/create.command";
import { InfoCommand } from "./commands/info.command";
import { StartCommand } from "./commands/start.command";
import { UpdateCommand } from "./commands/update.command";
import { PluginCommand } from "./commands/plugin.command";
import { getPluginsWithOut } from "./services/plugin.service";
import { createRequire } from "./utils/shims";

const require = createRequire(import.meta.url);
const pkg = require("../package.json");

const program = new Command("halsp")
  .usage("<command> [options]")
  .version(pkg.version, "-v, --version, -version, -V");

new CreateCommand(true).register(program);
new BuildCommand().register(program);
new StartCommand().register(program);
new InfoCommand().register(program);
new UpdateCommand().register(program);
new PluginCommand().register(program);

const plugins = await getPluginsWithOut();
plugins.forEach((p) => p.config.register(program));

program.parse(process.argv);

if (!program.args.length) {
  program.help();
}

export {};

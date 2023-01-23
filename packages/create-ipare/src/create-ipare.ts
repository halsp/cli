#!/usr/bin/env node

import { Command } from "commander";
import path from "path";
import { InitCommand } from "@ipare/cli/dist/commands/init.command";

const program = new Command("create-ipare");

program
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  .version(require(path.join(__dirname, "../package")).version);

new InitCommand().register(program);

program.parse(process.argv);

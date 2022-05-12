import { Command } from "commander";

export abstract class BaseCommand {
  abstract register(command: Command): void;
}

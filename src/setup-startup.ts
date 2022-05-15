import { Startup } from "@sfajs/core";

export type SetupStartup<T extends Startup = Startup> = (
  startup: T,
  mode?: string
) => T | Promise<T>;

import { Startup } from "@sfajs/core";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default async <T extends Startup>(startup: T, _mode?: string) => startup;

import { Startup } from "@sfajs/core";

export default async <T extends Startup>(startup: T, mode?: string) => startup;

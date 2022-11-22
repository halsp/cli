import { Startup } from "@ipare/core";

//just be placeholder
export default async <T extends Startup>(startup: T) => {
  return startup;
};

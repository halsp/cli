import { Startup } from "@ipare/core";

//just be placeholder
export default <T extends Startup>(startup: T, mode: string) => {
  console.log("mode", mode);
  return startup;
};

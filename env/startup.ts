import { Startup } from "@ipare/core";

//just be placeholder
export default <T extends Startup>(startup: T) => {
  return startup;
};

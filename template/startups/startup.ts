import { Startup } from "@halsp/core";

//just be placeholder
export default <T extends Startup>(startup: T) => {
  return startup;
};

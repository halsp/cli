// 腾讯云 CloudBase

import { SfaCloudbase } from "@sfajs/cloudbase";
import startup from "./startup";

const app = startup(new SfaCloudbase());
export const main = async (event: any, context: any): Promise<unknown> => {
  return await app.run(event, context);
};

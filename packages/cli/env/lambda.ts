// 1.云函数运行环境

import { LambdaStartup } from "@sfajs/lambda";
import startup from "./startup";

const app = startup(new LambdaStartup());
export const main = async (event: any, context: any): Promise<unknown> => {
  return await app.run(event, context);
};

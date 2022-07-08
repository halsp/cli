// 3.阿里云函数计算

import { SfaAlifunc } from "@sfajs/alifunc";
import startup from "./startup";

const app = startup(new SfaAlifunc());
export const handler = async function (req: any, resp: any, context: any) {
  await app.run(req, resp, context);
};

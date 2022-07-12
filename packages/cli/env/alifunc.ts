// 3.阿里云函数计算

import { AlifuncStartup } from "@ipare/alifunc";
import startup from "./startup";

const app = startup(new AlifuncStartup());
export const handler = async function (req: any, resp: any, context: any) {
  await app.run(req, resp, context);
};

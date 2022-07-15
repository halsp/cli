// 3.阿里云函数计算

import { AlifcStartup } from "@ipare/alifc";
import startup from "./startup";

const app = startup(new AlifcStartup());
export const handler = async function (req: any, resp: any, context: any) {
  await app.run(req, resp, context);
};

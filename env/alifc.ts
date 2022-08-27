// 3.阿里云函数计算

import { AlifcStartup } from "@ipare/alifc";
import startup from "./startup";

const app = startup(new AlifcStartup(), "production");
export const handler = (req: any, resp: any, context: any) =>
  app.run(req, resp, context);

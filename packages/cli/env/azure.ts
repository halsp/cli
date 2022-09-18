// 3.Azure Function App
// use lambda

import { LambdaStartup } from "@ipare/lambda";
import startup from "./startup";

const app = startup(new LambdaStartup(), "production");
export default async (context: any, req: any) => {
  context.res = await app.run(req, context);
};
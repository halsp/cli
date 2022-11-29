import { LambdaStartup } from "@ipare/lambda";
import startup from "./startup";

const app = startup(new LambdaStartup());
export default async (context: any, req: any) => {
  context.res = await app.run(req, context);
};

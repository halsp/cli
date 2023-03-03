import { AlifcStartup } from "@halsp/alifc";
import startup from "./startup";

const app = startup(new AlifcStartup());
export const handler = (req: any, resp: any, context: any) =>
  app.run(req, resp, context);

import { LambdaStartup } from "@halsp/lambda";
import startup from "./startup";

const app = startup(new LambdaStartup());
export const main = (event: any, context: any) => app.run(event, context);

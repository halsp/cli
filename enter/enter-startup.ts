import { HttpStartup } from "@ipare/http";
import chalk from "chalk";
import setupStartup from "./startup";

const mode = "{{MODE}}";
const port = "{{PORT}}";

async function bootstrap() {
  const startup = await setupStartup(new HttpStartup().useHttpJsonBody(), mode);
  const result = await startup.dynamicListen(parseInt(port) ?? 2333);
  console.log(chalk.blueBright(`start: http://localhost:${result.port}`));
  return result;
}

bootstrap();

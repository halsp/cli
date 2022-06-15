import { SfaHttp } from "@sfajs/http";
import chalk from "chalk";
import setupStartup from "./startup";

const mode = "{{MODE}}";
const port = "{{PORT}}";

async function bootstrap() {
  const startup = await setupStartup(new SfaHttp().useHttpJsonBody(), mode);
  const result = await startup.dynamicListen(parseInt(port) ?? 2333);
  console.log(chalk.blue(`start: http://localhost:${result.port}`));
  return result;
}

bootstrap();

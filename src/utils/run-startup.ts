import { SfaHttp } from "@sfajs/http";
import chalk from "chalk";
import { SetupStartup } from "./setup-startup";

const mode = "{{MODE}}";
const port = "{{PORT}}";

async function bootstrap() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const setupStartup: SetupStartup<SfaHttp> = require("./startup").default;
  const startup = await setupStartup(new SfaHttp().useHttpJsonBody(), mode);
  startup.use(async (ctx, next) => {
    await next();
  });
  const result = await startup.dynamicListen(parseInt(port) ?? 2333);
  console.log(chalk.blue(`start: http://localhost:${result.port}`));
  return result;
}

bootstrap();

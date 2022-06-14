import { Startup } from "@sfajs/core";
import "@sfajs/router";
import "@sfajs/swagger";
import "@sfajs/inject";
import "@sfajs/mva";
import "@sfajs/filter";
import * as fs from "fs";
import path from "path";
// {filter
import { GlobalActionFilter } from "./filters/global.action.filter";
// }
// { swagger
import { getSwaggerOptions } from "./utils/swagger";
// }

export default <T extends Startup>(startup: T, mode?: string) =>
  startup
    .use(async (ctx, next) => {
      ctx.res.setHeader("version", version);
      ctx.res.setHeader("mode", mode ?? "");
      await next();
    })
    // { inject
    .useInject()
    // }
    // { swagger
    .useSwagger({
      options: getSwaggerOptions(version),
    })
    // }
    // {filter
    .useFilter()
    .useGlobalFilter(GlobalActionFilter)
    // }
    // { mva
    .useMva()
    // }
    // { router&&!mva
    .useRouter();
// }

const version = (() => {
  const pkgName = "package.json";
  let dir = __dirname;
  let filePath = path.join(dir, pkgName);
  while (!fs.existsSync(filePath)) {
    dir = path.dirname(dir);
    filePath = path.join(dir, pkgName);
  }
  const pkgStr = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(pkgStr).version;
})();

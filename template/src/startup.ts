import { Startup } from "@sfajs/core";
import "@sfajs/router";
import "@sfajs/swagger";
import "@sfajs/inject";
import "@sfajs/mva";
import "@sfajs/filter";
import "@sfajs/static";
import "@sfajs/jwt";
import "@sfajs/view";
import * as fs from "fs";
import path from "path";
// {filter
import { GlobalActionFilter } from "./filters/global.action.filter";
// }
// { swagger
import { getSwaggerOptions } from "./utils/swagger";
// }
import { JwtService } from "@sfajs/jwt";
// { inject
import { parseInject } from "@sfajs/inject";
import { UserService } from "./services/user.service";
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
    /// { !router
    .use(async (ctx, next) => {
      const userService = await parseInject(ctx, UserService);
      const userInfo = userService.getUserInfo();
      //// { view
      ctx.setHeader("injectUserInfo", JSON.stringify(userInfo));
      //// }
      //// { !view
      ctx.ok(userInfo);
      //// }
      await next();
    })
    /// }
    // }
    // { swagger
    .useSwagger({
      options: getSwaggerOptions(version),
    })
    // }
    //{static
    // static homepage: /s
    .useStatic({
      dir: "static",
      prefix: "s",
    })
    //}
    //{jwt
    .useJwt({
      secret: "jwt-secret",
    })
    .use(async (ctx, next) => {
      const jwtService = await parseInject(ctx, JwtService);
      const testJwt = await jwtService.sign({
        id: 1,
      });
      // just for jwt test
      ctx.req.setHeader("Authorization", "Bearer " + testJwt);
      await next();
    })
    // default verify
    .useJwtVerify()
    //}
    // {filter
    .useFilter()
    .useGlobalFilter(GlobalActionFilter)
    // }
    // { mva
    .useMva()
    // }
    //{view && !mva
    .useView()
    ///{!router
    .use(async (ctx, next) => {
      await ctx.view("user", {
        id: 1,
        email: "hi@hal.wang",
      });
      await next();
    })
    ///}
    //}
    // { router && !mva
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

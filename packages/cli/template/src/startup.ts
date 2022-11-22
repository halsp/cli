import { Startup } from "@ipare/core";
import "@ipare/router";
import "@ipare/swagger";
import "@ipare/inject";
import "@ipare/mva";
import "@ipare/filter";
import "@ipare/static";
import "@ipare/jwt";
import "@ipare/view";
import "@ipare/validator";
import "@ipare/env";
import "@ipare/logger";
//{swagger || !env
import * as fs from "fs";
import path from "path";
//}
// {filter
import { GlobalActionFilter } from "./filters/global.action.filter";
// }
import { JwtService } from "@ipare/jwt";
// { inject
/// { !router || jwt
import { parseInject } from "@ipare/inject";
/// }
/// { !router
import { UserService } from "./services/user.service";
/// }
// }

export default <T extends Startup>(startup: T) =>
  startup
    //{env
    .useEnv()
    //}
    .use(async (ctx, next) => {
      ctx.res.setHeader("version", version);
      ctx.res.setHeader("env", process.env.NODE_ENV);
      await next();
    })
    //{inject
    .useInject()
    //}
    //{logger
    .useConsoleLogger()
    //}
    // { swagger
    .useSwagger({
      path: "",
      builder: (builder) =>
        builder
          .addTitle("NewApplication")
          .addDescription("A new application")
          .addLicense({
            name: "MIT",
          })
          .addContact({
            email: "hi@hal.wang",
          })
          .addServer({
            url: "/",
          })
          .addSecurityScheme("password", {
            type: "apiKey",
            in: "header",
            name: "Authorization",
          }),
    })
    // }
    //{static
    // static homepage: /s
    .useStatic({
      dir: "static",
      prefix: "s",
    })
    //}
    //{validator
    .useValidator()
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
    // { inject&&!router
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
    // }
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

//{!env
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
//}

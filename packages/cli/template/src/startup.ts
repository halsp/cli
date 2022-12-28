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
import { HttpStartup } from "@ipare/http";
import { MicroStartup } from "@ipare/micro";
//{http||micro
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

export default <T extends HttpStartup & MicroStartup>(startup: T) =>
  startup
    //{env
    .useEnv()
    //}
    //{http
    .use(async (ctx, next) => {
      ctx.res.set("version", version);
      ctx.res.set("env", process.env.NODE_ENV ?? "");
      await next();
    })
    //}
    //{micro
    .use(async (ctx, next) => {
      ctx.res.setBody({
        version: version,
        env: process.env.NODE_ENV ?? "",
      });
      await next();
    })
    //}
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
      ///{micro
      tokenProvider: (ctx) => ctx.req.body?.Authorization,
      ///}
    })
    .use(async (ctx, next) => {
      const jwtService = await parseInject(ctx, JwtService);
      const testJwt = await jwtService.sign({
        id: 1,
      });
      // just for jwt test
      ///{http
      ctx.req.set("Authorization", "Bearer " + testJwt);
      ///}
      ///{micro
      ctx.req.setBody({
        Authorization: "Bearer " + testJwt,
      });
      ///}
      await next();
    })
    // default verify
    .useJwtVerify()
    //}
    // { inject&&!router
    .use(async (ctx, next) => {
      const userService = await parseInject(ctx, UserService);
      const userInfo = userService.getUserInfo();
      ///{ micro
      ctx.res.setBody(userInfo);
      ///}
      ///{ http
      ////{ view
      ctx.set("injectUserInfo", JSON.stringify(userInfo));
      ////}
      ////{ !view
      ctx.res.ok(userInfo);
      ////}
      ///}
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
      const html = await ctx.view("user", {
        id: 1,
        email: "hi@hal.wang",
      });
      //{ http
      ctx.res.ok({
        html,
      });
      //}
      //{ micro
      ctx.res.setBody({ html });
      //}
      await next();
    })
    ///}
    //}
    // { router && !mva
    .useRouter();
// }

//{http||micro
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

/* replace
extends HttpStartup & MicroStartup
---
//{http&&!micro
extends HttpStartup
//}
//{micro&&!http
extends MicroStartup
//}
//{!micro&&!http
extends Startup
//}
 */

import "@halsp/router";
import "@halsp/swagger";
import "@halsp/inject";
import "@halsp/mva";
import "@halsp/filter";
import "@halsp/static";
import "@halsp/jwt";
import "@halsp/view";
import "@halsp/validator";
import "@halsp/env";
import "@halsp/logger";
import "@halsp/native";
import "@halsp/http";
import "@halsp/ws";
import "@halsp/cors";
//{ micro-grpc
import "@halsp/micro-grpc/server";
//}
//{ micro-mqtt
import "@halsp/micro-mqtt/server";
//}
//{ micro-redis
import "@halsp/micro-redis/server";
//}
//{ micro-tcp
import "@halsp/micro-tcp/server";
//}
//{ micro-nats
import "@halsp/micro-nats/server";
//}
import "@halsp/lambda";
import "@halsp/alifc";

//{http||micro
import * as fs from "fs";
import path from "path";
//}

import { Startup } from "@halsp/core";
import { JwtService } from "@halsp/jwt";

// {filter
import { GlobalActionFilter } from "./filters/global.action.filter";
// }
// { inject
/// { !router
import { UserService } from "./services/user.service";
/// }
// }

const startup = new Startup()
  //{lambda||azure
  .useLambda()
  //}
  //{alifc
  .useAlifc()
  //}
  //{lambda||alifc||native||azure
  .useNative()
  //}
  //{sls-http-huawei
  .useNative({
    port: 8000,
    host: "127.0.0.0",
  })
  //}
  //{sls-http-tcloud
  .useNative({
    port: 9000,
  })
  //}
  //{http
  .useHttp()
  //}
  //{micro-grpc
  .useMicroGrpc()
  //}
  //{micro-mqtt
  .useMicroMqtt()
  //}
  //{micro-nats
  .useMicroNats()
  //}
  //{micro-redis
  .useMicroRedis()
  //}
  //{micro-tcp
  .useMicroTcp()
  //}
  //{env
  .useEnv()
  //}
  //{ cors
  .useCors()
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
    useIndex: true,
    useExt: true,
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
    const jwtService = await ctx.getService(JwtService);
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
  //{ ws
  .useWebSocket()
  ///{ !router
  .use(async (ctx, next) => {
    if (ctx.req.path == "ws") {
      const ws = await ctx.acceptWebSocket();
      ws.on("ping", () => {
        ws.pong();
      });
      setTimeout(() => {
        ws.send("Hello!");
      }, 1000);
    }
    await next();
  })
  ///}
  //}
  // { inject&&!router
  .use(async (ctx, next) => {
    const userService = await ctx.getService(UserService);
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
    ////{ http
    ctx.res.ok(html);
    ////}
    ////{ micro
    ctx.res.setBody({ html });
    ////}
    await next();
  })
  ///}
  //}
  // { router && !mva
  .useRouter()
  // }
  //{ !view && !router && !mva
  .use(async (ctx, next) => {
    ///{ http
    ctx.res.ok({
      id: 1,
      email: "hi@hal.wang",
    });
    ///}
    ///{ micro
    ctx.res.setBody({
      id: 1,
      email: "hi@hal.wang",
    });
    ///}
    await next();
  });
//}

//{ micro-grpc||micro-mqtt||micro-redis||micro-nats||micro-tcp||sls-http-huawei||sls-http-tcloud
startup.listen();
//}
//{ native && !lambda && !alifc && !azure
startup.listen();
//}
//{ lambda||alifc||azure
if (process.env.NODE_ENV == "development") {
  startup.listen();
}
//}
//{ lambda
export const main = (e: any, c: any) => startup.run(e, c);
//}
//{ alifc
export const handler = (q: any, s: any, c: any) => startup.run(q, s, c);
//}
//{ azure
export default async (c: any, q: any) => (c.res = await startup.run(q, c));
//}

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

import { Startup } from "@sfajs/core";
import "@sfajs/router";
import "@sfajs/swagger";
import "@sfajs/inject";
import "@sfajs/mva";
import "@sfajs/filter";
import { swaggerJSDoc } from "@sfajs/swagger";
import * as fs from "fs";
// {filter
import { GlobalActionFilter } from "./filters/global.action.filter";
// }

export default <T extends Startup>(startup: T, mode?: string) =>
  startup
    .use(async (ctx, next) => {
      ctx.res.setHeader("version", version);
      await next();
    })
    // { inject
    .useInject()
    // }
    // { swagger
    .useSwagger({
      options: getSwaggerOptions(),
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

// { swagger
function getSwaggerOptions() {
  return <swaggerJSDoc.Options>{
    definition: {
      openapi: version,
      info: {
        title: "NewApplication",
        description: "A new application",
        version: version,
        license: {
          name: "MIT",
        },
        contact: {
          email: "hi@hal.wang",
        },
      },
      servers: [
        {
          url: "/",
        },
      ],
      schemes: ["https"],
      tags: [
        {
          name: "user",
        },
      ],
      components: {
        schemas: {
          user: {
            type: "object",
            properties: {
              id: {
                type: "integer",
                description: "Automatically generated ID",
              },
              password: {
                type: "string",
                description: "Plaintext password",
              },
            },
          },
        },
        securitySchemes: {
          password: {
            type: "apiKey",
            in: "header",
            name: "Authorization",
          },
        },
        parameters: {
          page: {
            in: "query",
            required: false,
            name: "page",
            schema: {
              type: "integer",
              minimum: 1,
              default: 1,
            },
          },
          limit: {
            in: "query",
            required: false,
            name: "limit",
            schema: {
              type: "integer",
              minimum: 1,
              default: 20,
            },
          },
        },
      },
    },
    apis: ["actions/**/*.js"],
  };
}
// }

const version = (() => {
  let path = "./package.json";
  while (!fs.existsSync(path)) {
    path = "../" + path;
  }
  const pkgStr = fs.readFileSync(path, "utf-8");
  return JSON.parse(pkgStr).version;
})();

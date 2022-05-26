import { Startup } from "@sfajs/core";
import "@sfajs/router";
import "@sfajs/swagger";
import "@sfajs/inject";
import "@sfajs/mva";
import { swaggerJSDoc } from "@sfajs/swagger";
import * as fs from "fs";

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
      options: getSwaggerOptions(mode),
    })
    // }
    // { mva
    .useMva()
    // }
    // { router-mva
    .useRouter();
// }

// { swagger
function getSwaggerOptions(mode?: string) {
  return <swaggerJSDoc.Options>{
    definition: {
      openapi: "3.0.1",
      info: {
        title: "Todo",
        description: "一个简易的 todo 项目，包含后端和前端",
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
          url: "/" + (mode == "development" ? "" : process.env.API_NAME),
        },
      ],
      schemes: ["https"],
      tags: [
        {
          name: "user",
        },
        {
          name: "todo",
        },
        {
          name: "bing",
          description: "bing images",
        },
      ],
      components: {
        schemas: {
          user: {
            type: "object",
            properties: {
              _id: {
                type: "string",
                description: "Automatically generated ID",
              },
              password: {
                type: "string",
                description: "Plaintext password",
              },
              create_at: {
                type: "integer",
                format: "timestamp",
                description: "When was user created",
              },
            },
          },
          todo: {
            type: "object",
            properties: {
              _id: {
                type: "string",
                description: "Automatically generated ID",
              },
              uid: {
                type: "string",
                description: "todo's owner",
              },
              content: {
                type: "string",
              },
              create_at: {
                type: "integer",
                format: "timestamp",
                description: "When was todo created",
              },
              update_at: {
                type: "integer",
                format: "timestamp",
                description: "When was todo edited",
              },
              schedule: {
                type: "integer",
                format: "timestamp",
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

import { Inject } from "@sfajs/inject";
import inquirer from "inquirer";
import { DepsService } from "./deps.service";
import path from "path";

export type Plugin =
  | "inject"
  | "router"
  | "views"
  | "mva"
  | "pipe"
  | "filter"
  | "testing"
  | "static"
  | "swagger"
  | "jwt";

export class PluginSelectService {
  @Inject
  private readonly depsService!: DepsService;

  public async select() {
    const { plugins } = await inquirer.prompt([
      {
        type: "checkbox",
        message: "Select plugins",
        name: "plugins",
        choices: [
          {
            value: "inject",
            name: "依赖注入 (@sfajs/inject)",
            checked: true,
          },
          {
            value: "router",
            name: "路由 (@sfajs/router)",
            checked: true,
          },
          {
            value: "views",
            name: "视图渲染 (@sfajs/views)",
          },
          {
            value: "mva",
            name: "Mva 框架 (@sfajs/mva)",
          },
          {
            value: "pipe",
            name: "管道，用于参数格式化 (@sfajs/pipe)",
            checked: true,
          },
          {
            value: "filter",
            name: "过滤器，用于拦截请求 (@sfajs/filter)",
          },
          {
            value: "testing",
            name: "测试工具 (@sfajs/testing)",
          },
          {
            value: "static",
            name: "静态资源 (@sfajs/static)",
          },
          {
            value: "swagger",
            name: "Swagger 文档 (@sfajs/swagger)",
          },
          {
            value: "jwt",
            name: "jwt 身份验证中间件 (@sfajs/jwt)",
          },
        ],
      },
    ]);
    return this.configPlugins(plugins);
  }

  private configPlugins(plugins: Plugin[]) {
    const result: Plugin[] = [...plugins];
    plugins.forEach((plugin) => {
      this.depsService
        .getPackageSfaDeps(`@sfajs/${plugin}`, [
          path.join(__dirname, "../.."),
          ...module.paths,
        ])
        .map((item) => item.key.replace(/^@sfajs\//, "") as Plugin)
        .forEach((dep) => {
          if (!result.includes(dep)) {
            result.push(dep);
          }
        });
    });
    return result;
  }
}

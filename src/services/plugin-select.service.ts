import { Inject } from "@sfajs/inject";
import inquirer from "inquirer";
import path from "path";
import { Plugin } from "../types";
import { DepsService } from "./deps.service";
import * as fs from "fs";

export class PluginSelectService {
  @Inject
  private readonly depsService!: DepsService;

  private get sourceDir() {
    return path.join(__dirname, "../../template");
  }

  public async select(): Promise<Plugin[]> {
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
            name: "管道 (用于参数格式化) (@sfajs/pipe)",
            checked: true,
          },
          {
            value: "filter",
            name: "过滤器 (用于拦截请求) (@sfajs/filter)",
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
    return plugins;
  }

  public async fixPlugins(
    plugins: Plugin[],
    ...paths: string[]
  ): Promise<Plugin[]> {
    const result: Plugin[] = [...plugins];
    const pkg = JSON.parse(
      await fs.promises.readFile(
        path.join(this.sourceDir, "package.json"),
        "utf-8"
      )
    );
    const { dependencies, devDependencies } = pkg;

    plugins.forEach((plugin) => {
      if (Object.keys(dependencies).some((dep) => dep == `@sfajs/${plugin}`)) {
        this.depsService
          .getPackageSfaDeps(`@sfajs/${plugin}`, paths)
          .map((item) => item.key.replace(/^@sfajs\//, "") as Plugin)
          .forEach((dep) => {
            if (!result.includes(dep)) {
              result.push(dep);
            }
          });
      }

      if (
        Object.keys(devDependencies).some((dep) => dep == `@sfajs/${plugin}`)
      ) {
        if (!result.includes(plugin)) {
          result.push(plugin);
        }
      }
    });
    return result;
  }
}

import { Command } from "commander";
import inquirer from "inquirer";
import { BaseCommand } from "./base.command";

export class CreateCommand extends BaseCommand {
  register(command: Command): void {
    command
      .command("create <name>")
      .alias("c")
      .description("Generate sfa application")
      .action(this.invoke.bind(this));
  }

  async invoke(name: string) {
    const answer = await this.getOptions();
    console.log("TODO", name, JSON.stringify(answer));
  }

  private async getOptions() {
    return await inquirer.prompt([
      {
        type: "list",
        message: "选择运行环境",
        name: "env",
        default: "http",
        choices: [
          {
            name: "Http 服务",
            value: "http",
          },
          {
            name: "腾讯云 CloudBase",
            value: "cloudbase",
          },
          {
            name: "阿里云函数计算",
            value: "alifunc",
          },
        ],
      },
      {
        type: "checkbox",
        message: "选择需要插件",
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
  }
}

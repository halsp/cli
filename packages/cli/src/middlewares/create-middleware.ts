import { Middleware } from "@sfajs/core";
import inquirer from "inquirer";
import * as fs from "fs";
import path from "path";
import {
  commentLineRegExp,
  commentStartRegExp,
  CreateService,
  Plugin,
} from "../services/create.service";
import { Inject } from "@sfajs/inject";
import { DepsService } from "../services/deps.service";

export class CreateMiddleware extends Middleware {
  @Inject
  private readonly createService!: CreateService;
  @Inject
  private readonly depsService!: DepsService;

  get name() {
    return this.ctx.commandArgs.name;
  }
  get templateEnvDir() {
    return path.join(__dirname, `../../template/env`);
  }
  get targetDir() {
    return path.join(process.cwd(), this.name);
  }

  async invoke(): Promise<void> {
    if (fs.existsSync(this.targetDir)) {
      const message = `Target directory ${this.targetDir} already exists. Overwrite?`;
      if (!(await this.isOverwrite(message))) {
        return;
      }
    }

    const plugins: Plugin[] = await this.getPlugins();
    this.createService.create(plugins, this.targetDir);

    const { env } = await this.getEnv();
    await this.createEnvFile(env);

    await this.next();
  }

  private async createEnvFile(env: string) {
    const sourceFilePath = path.join(this.templateEnvDir, `${env}.ts`);
    const targetFilePath = path.join(this.targetDir, `src/index.ts`);

    if (fs.existsSync(targetFilePath)) {
      const message = `The environment file already exists. Overwrite?`;
      if (!(await this.isOverwrite(message))) {
        return;
      }
    }

    const code = fs
      .readFileSync(sourceFilePath, "utf-8")
      .replace(commentLineRegExp, "")
      .trimStart();
    fs.writeFileSync(targetFilePath, code);
  }

  private async getPlugins() {
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

  private async getEnv() {
    const envs = fs
      .readdirSync(this.templateEnvDir)
      .filter((file) => !file.endsWith("startup.ts"))
      .filter((file) => {
        const stat = fs.statSync(path.join(this.templateEnvDir, file));
        return stat.isFile();
      })
      .map((file) => {
        const filePath = path.join(this.templateEnvDir, file);
        const name = fs
          .readFileSync(filePath, "utf-8")
          .replace(/\r\n/g, "\n")
          .split("\n")
          .filter((line) => commentStartRegExp.test(line))[0]
          .replace(commentStartRegExp, "");
        const env = file.replace(/\.ts$/, "");
        return {
          name,
          value: env,
        };
      });

    return await inquirer.prompt([
      {
        type: "list",
        message: "Select environment",
        name: "env",
        default: "http",
        choices: envs,
      },
    ]);
  }

  private async isOverwrite(message: string): Promise<boolean> {
    const { overwrite } = await inquirer.prompt([
      {
        type: "confirm",
        message: message,
        name: "overwrite",
        default: false,
      },
    ]);
    return overwrite as boolean;
  }
}

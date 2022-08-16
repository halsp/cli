type PluginItem = { value: string; name: string; default?: boolean };

export type Env = "http" | "lambda" | "alifc";

export type Plugin =
  | "inject"
  | "router"
  | "view"
  | "mva"
  | "pipe"
  | "filter"
  | "testing"
  | "static"
  | "swagger"
  | "jwt"
  | "core"
  | "cli"
  | "validator"
  | "env"
  | "logger"
  | Env;

export const allPlugins: PluginItem[] = [
  {
    value: "inject",
    name: "依赖注入 (@ipare/inject)",
    default: true,
  },
  {
    value: "router",
    name: "路由 (@ipare/router)",
    default: true,
  },
  {
    value: "view",
    name: "视图渲染 (@ipare/view)",
  },
  {
    value: "mva",
    name: "Mva 框架 (@ipare/mva)",
  },
  {
    value: "pipe",
    name: "管道 (用于参数格式化) (@ipare/pipe)",
    default: true,
  },
  {
    value: "filter",
    name: "过滤器 (用于拦截请求) (@ipare/filter)",
  },
  {
    value: "validator",
    name: "请求参数校验 (@ipare/validator)",
  },
  {
    value: "testing",
    name: "测试工具 (@ipare/testing)",
  },
  {
    value: "static",
    name: "静态资源 (@ipare/static)",
  },
  {
    value: "swagger",
    name: "Swagger 文档 (@ipare/swagger)",
  },
  {
    value: "jwt",
    name: "jwt 身份验证中间件 (@ipare/jwt)",
  },
  {
    value: "env",
    name: "环境配置插件 (@ipare/env)",
  },
  {
    value: "logger",
    name: "日志插件 (@ipare/logger)",
  },
];

export function isPlugin(name: string) {
  return allPlugins.some((p) => p.value == name || `@ipare/${p.value}` == name);
}

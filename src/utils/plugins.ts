type PluginItem = { value: string; name: string; default?: boolean };

export type Env = "http" | "cloudbase" | "alifunc";

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
  | Env;

export const allPlugins: PluginItem[] = [
  {
    value: "inject",
    name: "依赖注入 (@sfajs/inject)",
    default: true,
  },
  {
    value: "router",
    name: "路由 (@sfajs/router)",
    default: true,
  },
  {
    value: "view",
    name: "视图渲染 (@sfajs/view)",
  },
  {
    value: "mva",
    name: "Mva 框架 (@sfajs/mva)",
  },
  {
    value: "pipe",
    name: "管道 (用于参数格式化) (@sfajs/pipe)",
    default: true,
  },
  {
    value: "filter",
    name: "过滤器 (用于拦截请求) (@sfajs/filter)",
  },
  {
    value: "validator",
    name: "请求参数校验 (@sfajs/validator)",
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
];

export function isPlugin(name: string) {
  return allPlugins.some((p) => p.value == name || `@sfajs/${p.value}` == name);
}

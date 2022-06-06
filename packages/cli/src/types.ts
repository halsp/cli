export type Env = "http" | "cloudbase" | "alifunc";

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
  | "jwt"
  | "core"
  | "cli"
  | Env;

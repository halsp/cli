import { Configuration } from "./configuration";

// eslint-disable-next-line @typescript-eslint/ban-types
export type ConfigEnv = {};

export function defineConfig(
  config: Configuration
): (options: ConfigEnv) => Configuration;
export function defineConfig(
  config: (options: ConfigEnv) => Configuration
): (options: ConfigEnv) => Configuration;
export function defineConfig(
  config: Configuration | ((options: ConfigEnv) => Configuration)
): (options: ConfigEnv) => Configuration {
  if (typeof config == "object") {
    return () => config;
  } else {
    return config;
  }
}

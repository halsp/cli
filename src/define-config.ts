import { CommandType } from "./command-type";
import { Configuration } from "./configuration";

export type ConfigEnv = {
  mode: string;
  command: CommandType;
};

export function defineConfig(
  config: Configuration
): (options: ConfigEnv) => Configuration;
export function defineConfig(
  config: (options: ConfigEnv) => Configuration
): (options: ConfigEnv) => Configuration;
export function defineConfig(
  config: Configuration | ((options: ConfigEnv) => Configuration)
): (options: ConfigEnv) => Configuration {
  if (typeof config == "function") {
    return config;
  } else {
    return () => config;
  }
}

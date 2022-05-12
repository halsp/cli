import { Configuration } from ".";

export function defineConfig(
  config: Configuration
): (mode: string) => Configuration;
export function defineConfig(
  config: (mode: string) => Configuration
): (mode: string) => Configuration;
export function defineConfig(
  config: Configuration | ((mode: string) => Configuration)
): (mode: string) => Configuration {
  if (typeof config == "function") {
    return config;
  } else {
    return () => config;
  }
}

import fs from "fs";
import path from "path";
import tsc from "typescript";
import module from "module";
import vm from "vm";
import { ConfigurationOptions } from "./options.configuration";
import { Configuration } from ".";

export function loadConfig(options?: ConfigurationOptions): Configuration {
  const opts = {
    file: options?.file,
    mode: options?.mode ?? "production",
  };

  let code: string | undefined = undefined;
  if (opts.file) {
    code = readTxt(opts.file);
  } else {
    code = readAnyOfTxt([
      "sfa-cli.config.js",
      "sfacli.config.js",
      "sfa-cli.js",
      "sfacli.js",
    ]);

    if (!code) {
      code = readAnyOfTxt([
        "sfa-cli.config.ts",
        "sfacli.config.ts",
        "sfa-cli.ts",
        "sfacli.ts",
      ]);
      if (code) {
        const transpileOptions = getTsconfig() ?? {};
        const { outputText } = tsc.transpileModule(code, transpileOptions);
        code = outputText;
      }
    }
  }

  if (!code) {
    return {};
  }

  const module = getModuleFromString(code, "sfa-cli.config.js");
  if (module.default) {
    return module.default(opts.mode);
  } else if (module.exports) {
    return module.exports(opts.mode);
  } else {
    return {};
  }
}

function getTsconfig() {
  let filePath: string | undefined = undefined;

  const tsconfigFile = path.join(process.cwd(), "tsconfig.json");
  if (fs.existsSync(tsconfigFile)) {
    filePath = tsconfigFile;
  }

  if (filePath) {
    const tsconfig = fs.readFileSync(tsconfigFile, "utf-8");
    return JSON.parse(tsconfig) as tsc.TranspileOptions;
  }
}

function getModuleFromString(
  bundle: string,
  filename: string
): {
  default?: (mode: string) => Configuration;
  exports?: (mode: string) => Configuration;
} {
  const m: any = {};
  const wrapper = module.wrap(bundle);
  const script = new vm.Script(wrapper, {
    filename,
    displayErrors: true,
  });
  const result = script.runInThisContext();
  result.call(m, m, require, m);
  return m;
}

function readAnyOfTxt(names: string[]) {
  for (const name of names) {
    const txt = readTxt(name);
    if (txt) return txt;
  }
}

function readTxt(name: string): string | undefined {
  const file = path.resolve(process.cwd(), name);
  if (fs.existsSync(file)) {
    return fs.readFileSync(file, "utf-8");
  }
}

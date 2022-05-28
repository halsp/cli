import * as ts from "typescript";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { defineConfig } = require("../../src/configuration");
const dict: any = {};

export default defineConfig(() => ({
  build: {
    beforeHooks: [
      () => {
        return (): ts.Transformer<any> => {
          return (sf: ts.SourceFile) => {
            dict["beforeHook"] = sf.getText();
            return sf;
          };
        };
      },
    ],
    afterHooks: [
      () => {
        return (): ts.Transformer<any> => {
          return (sf: ts.SourceFile) => {
            dict["afterHook"] = sf.getText();
            return sf;
          };
        };
      },
    ],
    afterDeclarationsHooks: [
      () => {
        return (): ts.Transformer<any> => {
          return (sf: ts.SourceFile) => {
            dict["afterDeclarationsHook"] = sf.getText();
            return sf;
          };
        };
      },
    ],
  },
  dict: () => dict,
}));

import { defineConfig } from "@sfajs/cli";
import * as ts from "typescript";

const dict: any = {};

export default defineConfig((m) => ({
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

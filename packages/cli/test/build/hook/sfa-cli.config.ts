import ts from "typescript";
import { defineConfig } from "@sfajs/cli-common";
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

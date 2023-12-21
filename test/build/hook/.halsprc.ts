import ts from "typescript";
import { defineConfig } from "../../../src";
const dict: any = {};

export default defineConfig(() => ({
  build: {
    transformers: () => ({
      before: [
        (): ts.Transformer<any> => {
          return (sf: ts.SourceFile) => {
            dict["beforeHook"] = sf.getText();
            return sf;
          };
        },
      ],
      after: [
        (): ts.Transformer<any> => {
          return (sf: ts.SourceFile) => {
            dict["afterHook"] = sf.getText();
            return sf;
          };
        },
      ],
      afterDeclarations: [
        (): ts.Transformer<any> => {
          return (sf: ts.SourceFile) => {
            dict["afterDeclarationsHook"] = sf.getText();
            return sf;
          };
        },
      ],
    }),
  },
  dict: () => dict,
}));

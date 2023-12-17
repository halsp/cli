import { CliStartup } from "../../src/cli-startup";
import { BuildMiddlware } from "../../src/middlewares/build.middleware";
import { runin } from "../utils";
import fs from "fs";

describe("skip-js-ext-transformer", () => {
  it("should compiler import path and NOT add js extention", async () => {
    let callCount = 0;
    await runin(`test/build/skip-js-ext-transformer`, async () => {
      await new CliStartup("test", undefined, {
        skipJsExtTransformer: true,
        config: "skip.halsprc.ts",
      })
        .use(async (ctx, next) => {
          await next();

          const code = fs.readFileSync(
            "./node_modules/.halsp/index.js",
            "utf-8",
          );
          code.includes("./test.js").should.false;
          callCount++;
        })
        .add(BuildMiddlware)
        .run();
      callCount++;
    });
    callCount.should.eq(2);
  });

  it("should compiler import path and add js extention", async () => {
    let callCount = 0;
    await runin(`test/build/skip-js-ext-transformer`, async () => {
      await new CliStartup("test", undefined, {})
        .use(async (ctx, next) => {
          await next();

          const code = fs.readFileSync(
            "./node_modules/.halsp/index.js",
            "utf-8",
          );
          code.includes("./test.js").should.true;
          callCount++;
        })
        .add(BuildMiddlware)
        .run();
      callCount++;
    });
    callCount.should.eq(2);
  });
});

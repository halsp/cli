import { Server } from "http";
import { CliStartup } from "../../src/cli-startup";
import { ServeMiddleware } from "../../src/middlewares/serve.middleware";
import { ChdirMiddleware } from "../../src/middlewares/chdir.middleware";
import supertest from "supertest";
import { Context } from "@halsp/core";
import { runin } from "../utils";

function testResultAfter2000ms(
  ctx: Context,
  test: (server: Server) => Promise<void>,
  cb: (err?: Error) => void
) {
  setTimeout(async () => {
    const server = (ctx.res.body as any).server as Server;
    try {
      await test(server);
    } catch (e) {
      cb(e as Error);
    } finally {
      server.close(() => {
        cb();
      });
    }
  }, 2000);
}

describe("exclude", () => {
  async function runTest(exclude: string) {
    await new Promise<void>(async (resolve, reject) => {
      await new CliStartup(
        "serve",
        {
          app: "test/serve/static",
        },
        {
          exclude: exclude,
        }
      )
        .use(async (ctx, next) => {
          testResultAfter2000ms(
            ctx,
            async (server) => {
              await supertest(server)
                .get("/index")
                .expect(exclude ? 404 : 200)
                .expect((exclude ? /<span>404<\/span>/ : "test") as any)
                .expect("content-type", "text/html");
            },
            (err) => (err ? reject(err) : resolve())
          );
          await next();
        })
        .add(ChdirMiddleware)
        .add(ServeMiddleware)
        .run();
    });
  }

  it("should return index.html when exclude is undefined", async () => {
    await runTest("");
  });
  it("should return 404.html when exclude is *.html", async () => {
    await runTest("*.html");
  });
  it("should return 404.html when exclude is '*.html *.txt'", async () => {
    await runTest("*.html *.txt");
  });
});

describe("dir", () => {
  async function runTest(hideDir: true | undefined) {
    await new Promise<void>(async (resolve, reject) => {
      await new CliStartup(
        "serve",
        {
          app: "test/serve/static",
        },
        {
          hideDir: hideDir as any,
        }
      )
        .use(async (ctx, next) => {
          testResultAfter2000ms(
            ctx,
            async (server) => {
              await supertest(server)
                .get("/dir")
                .expect(hideDir ? 404 : 200)
                .expect(
                  (hideDir ? /<span>404<\/span>/ : /<ul id="files">/) as any
                )
                .expect("content-type", "text/html");
            },
            (err) => (err ? reject(err) : resolve())
          );
          await next();
        })
        .add(ChdirMiddleware)
        .add(ServeMiddleware)
        .run();
    });
  }

  it("should list dir", async () => {
    await runTest(undefined);
  });

  it("should be 404 when hideDir is true", async () => {
    await runTest(true);
  });
});

describe("app", () => {
  it("should serve process.cwd() when arg app is undefined", async () => {
    await runin("test/serve/static", async () => {
      await new Promise<void>(async (resolve, reject) => {
        await new CliStartup("serve", {}, {})
          .use(async (ctx, next) => {
            testResultAfter2000ms(
              ctx,
              async (server) => {
                await supertest(server)
                  .get("/")
                  .expect(200)
                  .expect("test")
                  .expect("content-type", "text/html");
              },
              (err) => (err ? reject(err) : resolve())
            );
            await next();
          })
          .add(ChdirMiddleware)
          .add(ServeMiddleware)
          .run();
      });
    });
  });
});

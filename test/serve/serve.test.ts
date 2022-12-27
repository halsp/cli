import { Server } from "http";
import { CliStartup } from "../../src/cli-startup";
import { ServeMiddleware } from "../../src/middlewares/serve.middleware";
import supertest from "supertest";
import { runin } from "../utils";

describe("exclude", () => {
  async function runTest(exclude: string) {
    const res = await new CliStartup(
      "serve",
      {
        targetPath: "test/serve/static",
      },
      {
        exclude: exclude,
      }
    )
      .add(ServeMiddleware)
      .run();

    const server = (res.body as any).server as Server;

    await supertest(server)
      .get("/index")
      .expect(exclude ? 404 : 200)
      .expect((exclude ? /<span>404<\/span>/ : "test") as any)
      .expect("content-type", "text/html");

    await new Promise<void>((resolve) => {
      server.close(() => {
        resolve();
      });
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
    const res = await new CliStartup(
      "serve",
      {
        targetPath: "test/serve/static",
      },
      {
        hideDir: hideDir as any,
      }
    )
      .add(ServeMiddleware)
      .run();

    const server = (res.body as any).server as Server;

    await supertest(server)
      .get("/dir")
      .expect(hideDir ? 404 : 200)
      .expect((hideDir ? /<span>404<\/span>/ : /<ul id="files">/) as any)
      .expect("content-type", "text/html");

    await new Promise<void>((resolve) => {
      server.close(() => {
        resolve();
      });
    });
  }

  it("should list dir", async () => {
    await runTest(undefined);
  });

  it("should be 404 when hideDir is true", async () => {
    await runTest(true);
  });
});

describe("targetPath", () => {
  it("should serve process.cwd() when target path is undefined", async () => {
    await runin("test/serve/static", async () => {
      const res = await new CliStartup("serve", {}, {})
        .add(ServeMiddleware)
        .run();

      const server = (res.body as any).server as Server;

      await supertest(server)
        .get("/")
        .expect(200)
        .expect("test")
        .expect("content-type", "text/html");

      await new Promise<void>((resolve) => {
        server.close(() => {
          resolve();
        });
      });
    });
  });
});

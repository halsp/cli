import { Middleware, Startup } from "@halsp/core";
import { Inject } from "@halsp/inject";
import { CommandService } from "../services/command.service";
import { dynamicImport, dynamicImportDefault } from "../utils/dynamic-import";
import { GetPort } from "../utils/dynamic-types/get-port";

export class ServeMiddleware extends Middleware {
  @Inject
  private readonly commandService!: CommandService;

  private get port() {
    return this.commandService.getOptionVlaue<string>("port");
  }
  private get hostname() {
    return this.commandService.getOptionVlaue<string>("hostname");
  }
  private get hideDir() {
    return this.commandService.getOptionVlaue<boolean>("hideDir");
  }
  private get exclude() {
    const strs = this.commandService.getOptionVlaue<string>("exclude");
    if (!strs) return undefined;

    return strs.split(" ").filter((item) => !!item);
  }
  private get prefix() {
    return this.commandService.getOptionVlaue<string>("prefix");
  }
  private get encoding() {
    return this.commandService.getOptionVlaue<string>("encoding");
  }

  async invoke() {
    require("@halsp/native");
    require("@halsp/static");

    const port = Number(this.port) || (await this.getDefPort());
    const server = await new Startup()
      ["useNative"]({
        port: port,
        host: this.hostname,
      })
      ["useStatic"]({
        dir: process.cwd(),
        listDir: !this.hideDir,
        use404: true,
        useIndex: true,
        method: "ANY",
        useExt: true,
        exclude: this.exclude,
        prefix: this.prefix,
        encoding: this.encoding as BufferEncoding,
      })
      .listen();

    this.ctx.res.setBody(server);
    await new Promise((resolve, reject) => {
      server.on("close", resolve);
      server.on("error", reject);
    });
  }

  private async getDefPort() {
    const { portNumbers } = await dynamicImport("get-port");
    const getPort = await dynamicImportDefault<GetPort>("get-port");
    return await getPort({ port: portNumbers(9504, 9600) });
  }
}

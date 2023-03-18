import { Middleware } from "@halsp/core";
import { Inject } from "@halsp/inject";
import { CommandService } from "../services/command.service";

export class ServeMiddleware extends Middleware {
  @Inject
  private readonly commandService!: CommandService;

  private get targetPath() {
    return this.ctx.commandArgs.targetPath;
  }
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
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { NativeStartup } = require("@halsp/native");
    require("@halsp/static");

    const listen = await new NativeStartup()
      .useStatic({
        dir: this.targetPath ?? process.cwd(),
        listDir: !this.hideDir,
        use404: true,
        useIndex: true,
        method: "ANY",
        useExt: true,
        exclude: this.exclude,
        prefix: this.prefix,
        encoding: this.encoding as BufferEncoding,
      })
      .dynamicListen(this.port, this.hostname);

    this.ctx.res.setBody(listen);
  }
}

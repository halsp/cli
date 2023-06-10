//{ ws && router
import { Action } from "@halsp/router";

export default class extends Action {
  async invoke() {
    const ws = await this.ctx.acceptWebSocket();

    ws.on("ping", () => {
      ws.pong();
    });

    setTimeout(() => {
      ws.send("Hello!");
    }, 1000);
  }
}
//}

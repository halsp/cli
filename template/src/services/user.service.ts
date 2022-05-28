//{inject
import { HttpContext } from "@sfajs/core";
import { Context } from "@sfajs/pipe";

export class UserService {
  //{pipe
  @Context
  private readonly ctx!: HttpContext;
  //}

  public getUserInfo() {
    this.ctx.res.setHeader("test-header", "sfa");

    return {
      id: 1,
      email: "hi@hal.wang",
    };
  }
}
//}

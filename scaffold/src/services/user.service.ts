//{inject
import { Context } from "@halsp/core";
import { Logger } from "@halsp/logger";
import { Query } from "@halsp/pipe";
import { V } from "@halsp/validator";
import { Inject } from "@halsp/inject";

export class UserService {
  @Inject
  private readonly ctx!: Context;
  //{logger
  @Logger()
  private readonly logger!: Logger;
  //}

  //{!router && validator && http
  @V().IsString()
  @Query("userName")
  private readonly userName!: string;
  @V().IsNumberString()
  @Query("userId")
  private readonly uid!: string;
  //}

  public getUserInfo() {
    //{http
    this.ctx.res.set("test-header", "halsp");
    //}
    //{logger
    this.logger.info("get user info from service");
    //}

    return {
      id: 1,
      email: "hi@hal.wang",
    };
  }
}
//}

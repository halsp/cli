//{inject
//{pipe
import { Context, ILogger } from "@ipare/core";
//}
import { Logger } from "@ipare/logger";
import { Ctx, Query } from "@ipare/pipe";
import { V } from "@ipare/validator";

export class UserService {
  //{pipe
  @Ctx
  private readonly ctx!: Context;
  //}
  //{logger
  @Logger()
  private readonly logger!: ILogger;
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
    //{pipe && http
    this.ctx.res.set("test-header", "ipare");
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

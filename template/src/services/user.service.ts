//{inject
//{pipe
import { HttpContext } from "@ipare/core";
import { Logger, winston } from "@ipare/logger";
//}
import { Context, Query } from "@ipare/pipe";
//{validator
import { IsString, IsNumberString } from "class-validator";
//}

export class UserService {
  //{pipe
  @Context
  private readonly ctx!: HttpContext;
  //}
  //{logger
  @Logger()
  private readonly logger!: winston.Logger;
  //}

  //{!router&&validator
  @IsString()
  @Query("userName")
  private readonly userName!: string;
  @IsNumberString()
  @Query("userId")
  private readonly uid!: string;
  //}

  public getUserInfo() {
    //{pipe
    this.ctx.res.setHeader("test-header", "ipare");
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

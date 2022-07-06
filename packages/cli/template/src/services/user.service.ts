//{inject
//{pipe
import { HttpContext } from "@sfajs/core";
//}
import { Context, Query } from "@sfajs/pipe";
//{validator
import { IsString, IsNumberString } from "class-validator";
//}

export class UserService {
  //{pipe
  @Context
  private readonly ctx!: HttpContext;
  //}

  //{validator
  @IsString()
  @Query("userName")
  private readonly userName!: string;
  @IsNumberString()
  @Query("userId")
  private readonly uid!: string;
  //}

  public getUserInfo() {
    //{pipe
    this.ctx.res.setHeader("test-header", "sfa");
    //}

    return {
      id: 1,
      email: "hi@hal.wang",
    };
  }
}
//}

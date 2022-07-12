//{inject
//{pipe
import { HttpContext } from "@ipare/core";
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
    this.ctx.res.setHeader("test-header", "ipare");
    //}

    return {
      id: 1,
      email: "hi@hal.wang",
    };
  }
}
//}

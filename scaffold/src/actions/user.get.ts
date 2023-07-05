//{ router
import { UseFilters } from "@halsp/filter";
import { Inject } from "@halsp/inject";
import { Header, Query } from "@halsp/pipe";
import { Action } from "@halsp/router";
import { V } from "@halsp/validator";
import "@halsp/view";
///{micro
import { MicroPattern } from "@halsp/router";
///}
///{filter
import { AuthFilter } from "../filters/auth.filter";
///}
///{inject
import { UserService } from "../services/user.service";
///}

//{swagger
import { LoginDto } from "../dtos/login.dto";
//}

//{filter
@UseFilters(AuthFilter)
//}
//{swagger
@V()
  .Tags("user")
  .Description("Get user info with auth filter")
  .Response(LoginDto)
//}
//{micro
///{micro-grpc
@MicroPattern("user/UserService/getUserInfo")
///}
///{
@MicroPattern("getUserInfo")
///}
//}
export default class extends Action {
  //{inject
  @Inject
  private readonly userService!: UserService;
  //}

  //{pipe && http
  @Header("host")
  private readonly host!: string;
  //}

  //{pipe && http
  ///{validator&&!swagger
  @V().IsString()
  ///}
  ///{swagger
  @V().Required().IsString().MinLength(6).MaxLength(20).Description("user name")
  ///}
  @Query("userName")
  private readonly userName!: string;
  ///{validator&&!swagger
  @V().IsNumberString()
  ///}
  ///{swagger
  @V().Required().IsNumberString().Description("user id")
  ///}
  @Query("userId")
  private readonly userId!: string;
  //}

  async invoke(): Promise<void> {
    //{logger
    this.logger.info("get user info from action");
    //}

    const userInfo = this.getUserInfo();
    //{ view && !mva
    await this.ctx.res.view("user", userInfo);
    //}

    //{!view || mva
    ///{ micro
    this.res.setBody(userInfo);
    ///}
    ///{ !micro
    this.ok(userInfo);
    ///}
    //}
  }

  getUserInfo() {
    //{inject
    return this.userService.getUserInfo();
    //}
    //{!inject
    return {
      id: 1,
      email: "hi@hal.wang",
    };
    //}
  }
}
//}

/* rename
//{micro
getUserInfo.ts
//}
 */

//{ router
import { UseFilters } from "@ipare/filter";
import { Inject } from "@ipare/inject";
import { Header, Query } from "@ipare/pipe";
import { Action } from "@ipare/router";
import { V } from "@ipare/validator";
//{filter
import { AuthFilter } from "../filters/auth.filter";
//}
//{inject
import { UserService } from "../services/user.service";
//}

//{swagger
import { LoginDto } from "../dtos/login.dto";
//}

//{filter
@UseFilters(AuthFilter)
//}
//{swagger
@V().Tags("user").Description("Get user info").Response(LoginDto)
//}
export default class extends Action {
  //{inject
  @Inject
  private readonly userService!: UserService;
  //}

  //{pipe
  @Header("host")
  private readonly host!: string;
  //}

  //{pipe
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
    //!
    {
      //{inject
      const userInfo = this.userService.getUserInfo();
      ///{ view && !mva
      await this.view("user", userInfo);
      ///}
      ///{!view || mva
      this.ok(userInfo);
      ///}
      //}
      //!
    }

    //!
    {
      //{!inject
      const userInfo = {
        id: 1,
        email: "hi@hal.wang",
      };
      ///{ view && !mva
      await this.view("user", userInfo);
      ///}
      ///{!view || mva
      this.ok(userInfo);
      ///}
      //}
      //!
    }
  }
}
//}

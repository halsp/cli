//{ router
import { UseFilters } from "@ipare/filter";
import { Inject } from "@ipare/inject";
import { Header, Query } from "@ipare/pipe";
import { Action } from "@ipare/router";
//{swagger
import {
  ApiDescription,
  ApiResponses,
  ApiTags,
  DtoDescription,
  DtoLengthRange,
  DtoRequired,
} from "@ipare/swagger";
//}
//{filter
import { AuthFilter } from "../filters/auth.filter";
//}
//{inject
import { UserService } from "../services/user.service";
//}
import { Logger, winston } from "@ipare/logger";
//{validator
import { IsString, IsNumberString } from "class-validator";
//}

//{filter
@UseFilters(AuthFilter)
//}
//{swagger
@ApiTags("user")
@ApiDescription("Get user info")
@ApiResponses({
  "200": {
    description: "success",
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/LoginDto",
        },
      },
    },
  },
})
//}
export default class extends Action {
  //{inject
  @Inject
  private readonly userService!: UserService;
  //}
  //{logger
  @Logger()
  private readonly logger!: winston.Logger;
  //}

  //{pipe
  @Header("host")
  private readonly host!: string;
  //}

  //{pipe
  ///{validator
  @IsString()
  ///}
  ///{swagger
  @DtoRequired()
  @DtoLengthRange({ min: 6, max: 20 })
  @DtoDescription("user name")
  ///}
  @Query("userName")
  private readonly userName!: string;
  ///{validator
  @IsNumberString()
  ///}
  ///{swagger
  @DtoRequired()
  @DtoDescription("user id")
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

//{ router
import { UseFilters } from "@ipare/filter";
import { Inject } from "@ipare/inject";
import { Header } from "@ipare/pipe";
import { Action } from "@ipare/router";
import { ApiDescription, ApiResponses, ApiTags } from "@ipare/swagger";
//{filter
import { AuthFilter } from "../filters/auth.filter";
//}
//{inject
import { UserService } from "../services/user.service";
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

  //{pipe
  @Header("host")
  private readonly host!: string;
  //}

  async invoke(): Promise<void> {
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

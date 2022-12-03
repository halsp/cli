//{ router
import { Action, MicroPattern } from "@ipare/router";
import { Body } from "@ipare/pipe";
import { V } from "@ipare/validator";
//{pipe
import { LoginDto } from "../dtos/login.dto";
//}

//{swagger
@V()
  .Tags("user")
  .Description("Login")
  .Response(200, LoginDto)
  .ResponseDescription(200, "success")
  .ResponseDescription(404, "The account not existing or error password")
//}
//{micro
///{micro-grpc
@MicroPattern("user/UserService/login")
///}
///{
@MicroPattern("login")
///}
//}
export default class extends Action {
  //{pipe
  @Body
  private readonly loginDto!: LoginDto;
  //}

  //{swagger && !pipe
  @Body("account")
  private readonly account!: string;
  @Body("password")
  private readonly password!: string;
  //}

  async invoke(): Promise<void> {
    //{ http
    ///{ pipe
    this.ok({
      id: 1,
      email: "hi@hal.wang",
      account: this.loginDto.account,
    });
    ///}

    ///{ !pipe
    this.ok({
      id: 1,
      email: "hi@hal.wang",
      account: this.ctx.req.body["account"],
    });
    ///}
    //}

    //{ micro
    ///{ pipe
    this.res.setBody({
      id: 1,
      email: "hi@hal.wang",
      account: this.loginDto.account,
    });
    ///}

    ///{ !pipe
    this.res.setBody({
      id: 1,
      email: "hi@hal.wang",
      account: this.ctx.req.body["account"],
    });
    ///}
    //}
  }
}
//}

/* rename
//{micro
login.ts
//}
 */

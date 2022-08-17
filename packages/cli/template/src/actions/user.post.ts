//{ router
import { Action } from "@ipare/router";
import { Body } from "@ipare/pipe";
import { ApiDescription, ApiResponses, ApiTags } from "@ipare/swagger";
//{pipe
import { LoginDto } from "../dtos/login.dto";
//}
//{validator
import { IsNumberString, IsString } from "class-validator";
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
  "404": {
    description: "The account not existing or error password",
  },
})
//}
export default class extends Action {
  //{pipe
  @Body
  private readonly loginDto!: LoginDto;
  //}

  //{swagger
  @Body("account")
  private readonly account!: string;
  @Body("password")
  private readonly password!: string;
  //}

  async invoke(): Promise<void> {
    //{ pipe
    this.ok(this.loginDto);
    //}

    //{ !pipe
    this.ok({
      id: 1,
      email: "hi@hal.wang",
    });
    //}
  }
}
//}

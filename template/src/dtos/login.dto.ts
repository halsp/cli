//{pipe && router
import { V } from "@halsp/validator";

//{swagger
@V().Description("login info")
//}
export class LoginDto {
  //{validator&&!swagger
  @V().IsEmail()
  //}
  //{swagger
  @V().IsEmail().Description("email").Format("email")
  //}
  account!: string;

  //{validator&&!swagger
  @V().IsString()
  //}
  //{swagger
  @V().IsString().Description("password").MinLength(8).MaxLength(24)
  //}
  password!: string;
}
//}

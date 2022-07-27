//{pipe && router
import { DtoDescription, DtoFormat, DtoLengthRange } from "@ipare/swagger";
//{validator
import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";
//}

//{swagger
@DtoDescription("login info")
//}
export class LoginDto {
  //{swagger
  @DtoDescription("email")
  @DtoFormat("email")
  //}
  //{validator
  @IsEmail()
  //}
  account!: string;

  //{swagger
  @DtoDescription("password")
  @DtoLengthRange({
    min: 8,
    max: 24,
  })
  //}
  //{validator
  @IsString()
  @MinLength(8)
  @MaxLength(24)
  //}
  password!: string;
}
//}

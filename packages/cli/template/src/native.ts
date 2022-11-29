//{ lambda || alifc
import { NativeStartup } from "@ipare/native";
import setupStartup from "./startup";

async function bootstrap() {
  const startup = setupStartup<any>(new NativeStartup().useHttpJsonBody()).dynamicListen();
  await startup.dynamicListen();
}

bootstrap();
//}

/* replace
 setupStartup<any>
 setupStartup
 */
//{ lambda || alifc
import { NativeStartup } from "@halsp/native";
import setupStartup from "./startup";

async function bootstrap() {
  const startup = setupStartup<any>(new NativeStartup().useHttpJsonBody());
  await startup.dynamicListen();
}

bootstrap();
//}

/* replace
 setupStartup<any>
 setupStartup
 */

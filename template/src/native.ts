//{ lambda || alifc
import { NativeStartup } from "@ipare/native";
import setupStartup from "./startup";

async function bootstrap() {
  const startup = setupStartup<any>(new NativeStartup().useHttpJsonBody());
  const { port } = await startup.dynamicListen();
  console.info(`start: http://localhost:${port}`);
}

bootstrap();
//}

/* replace
 setupStartup<any>
 setupStartup
 */

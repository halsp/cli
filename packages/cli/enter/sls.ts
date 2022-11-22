import { NativeStartup } from "@ipare/native";
import setupStartup from "./startup";

async function bootstrap() {
  const startup = await setupStartup(
    new NativeStartup()
      .useHttpJsonBody()
      .useHttpTextBody()
      .useHttpMultipartBody()
      .useHttpUrlencodedBody()
  );
  const { port } = await startup.dynamicListen();
  console.info(`start: http://localhost:${port}`);
}

bootstrap();

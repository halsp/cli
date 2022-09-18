import { HttpStartup } from "@ipare/http";
import startup from "./startup";

const app = startup(new HttpStartup(), "production");
app.listen(8000, "127.0.0.0");

import { HttpStartup } from "@ipare/http";
import startup from "./startup";

const app = startup(new HttpStartup(), "production");
app.listen(9000);

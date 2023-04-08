import { NativeStartup } from "@halsp/native";
import startup from "./startup";

startup(new NativeStartup()).listen(9000);

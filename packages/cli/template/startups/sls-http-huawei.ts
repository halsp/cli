import { NativeStartup } from "@ipare/native";
import startup from "./startup";

startup(new NativeStartup()).listen(8000, "127.0.0.0");

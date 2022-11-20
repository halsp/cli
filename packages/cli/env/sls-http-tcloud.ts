import { NativeStartup } from "@ipare/native";
import startup from "./startup";

startup(new NativeStartup(), "production").listen(9000);

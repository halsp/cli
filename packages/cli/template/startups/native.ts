import { NativeStartup } from "@ipare/native";
import startup from "./startup";

startup(new NativeStartup()).dynamicListen();

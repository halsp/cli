import { MicroMqttStartup } from "@ipare/micro-mqtt";
import startup from "./startup";

startup(new MicroMqttStartup()).listen();

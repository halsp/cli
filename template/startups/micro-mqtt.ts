import { MicroMqttStartup } from "@halsp/micro-mqtt";
import startup from "./startup";

startup(new MicroMqttStartup()).listen();

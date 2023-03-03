import { MicroRedisStartup } from "@halsp/micro-redis";
import startup from "./startup";

startup(new MicroRedisStartup()).listen();

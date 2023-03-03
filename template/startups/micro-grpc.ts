import { MicroGrpcStartup } from "@halsp/micro-grpc";
import startup from "./startup";

startup(new MicroGrpcStartup()).listen();

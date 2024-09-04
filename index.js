import { ExpressServer } from "./configs/app.js";
import { config } from "dotenv";

config()

const server = new ExpressServer()

server.listen()
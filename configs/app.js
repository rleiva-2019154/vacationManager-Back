import express from "express";
import cors from 'cors';
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "../src/auth/auth.routes.js";
import vacationsRoutes from "../src/vacationRequest/vacationRequest.routes.js";
import holidayRoutes from "../src/holidays/holiday.routes.js";
import teamRoutes from "../src/teams/team.routes.js";
import { dbConnection } from './db.js';
import { createDefaultAdminUser } from "../src/auth/auth.controller.js";

export class ExpressServer {
    constructor() {
        this.urlBase = '/vacationManager/v1';
        this.app = express();
        this.middlewares();
        this.connectDB();
        this.routes();
    }

    async connectDB() {
        try {
            await dbConnection();
            await createDefaultAdminUser();
        } catch (err) {
            console.error("Error al conectar a la base de datos o crear el usuario BOSS", err);
            process.exit(1);
        } 
    }

    middlewares() {
        this.app.use(cors());
        this.app.use(express.urlencoded({ extended: false }));
        this.app.use(express.json());
        this.app.use(helmet());
        this.app.use(morgan('dev'));
    }

    routes() {
        this.app.options('*', cors());
        this.app.use(`${this.urlBase}/auth`, authRoutes);
        this.app.use(`${this.urlBase}/vacations`, vacationsRoutes);
        this.app.use(`${this.urlBase}/holidays`, holidayRoutes);
        this.app.use(`${this.urlBase}/teams`, teamRoutes);
    }

    listen() {
        this.app.listen(process.env.PORT, () => {
            console.log(`Server HTTP is running in port ${process.env.PORT}`);
        });
    }
}

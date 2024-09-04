
import express from "express";
import cors from 'cors';
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "../src/auth/auth.routes.js"
import { dbConnection } from './db.js'
import { createDefaultBossUser } from "../src/auth/auth.controller.js";

export class ExpressServer {
    constructor(){
        this.urlBase = '/vacationManager/v1'
        this.app = express()
        this.middlewares()
        this.connectDB()
        this.routes()
    }
    async connectDB(){
        try {
            await dbConnection(),
            await createDefaultBossUser();
        } catch (err) {
            console.error("Error al conectar a la base de datos o crear el usuario BOSS", err);
            process.exit(1);
        } 
    }
    middlewares(){
        this.app.use(cors())
        this.app.use(express.urlencoded({extended: false}))
        this.app.use(helmet())
        this.app.use(morgan('dev'))
    }
    routes(){
        this.app.use(`${this.urlBase}/auth`, authRoutes)
    }
    listen(){
        this.app.listen(process.env.PORT, ()=>{
            console.log(`Server HTTP is running in port ${process.env.PORT}`)
        })
    }
}
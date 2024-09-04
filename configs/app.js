
import express from "express";
import cors from 'cors';
import helmet from "helmet";
import morgan from "morgan";
import { dbConnection } from './db.js'

export class ExpressServer {
    constructor(){
        this.urlBase = '/vacationManager-Back'
        this.app = express()
        this.middlewares()
        this.connectDB()
        this.routes()
    }
    async connectDB(){
        await dbConnection()
    }
    middlewares(){
        this.app.use(cors())
        this.app.use(express.urlencoded({extended: false}))
        this.app.use(helmet())
        this.app.use(morgan('dev'))
    }
    routes(){
        //this.app.use(`${this.urlBase}`)
    }
    listen(){
        this.app.listen(process.env.PORT, ()=>{
            console.log(`Server HTTP is running in port ${process.env.PORT}`)
        })
    }
}
import { Router } from "express";
import {
    register,
    assignRole,
    login,
    getUsers
} from './auth.controller.js'
import { registerValidator, loginValidator } from "../../middlewares/check-validators.js";
import { validateJwt } from "../../middlewares/validate_Jwt.js";
import { isAdmin }from '../../middlewares/role-auth.js'

const api = Router()

api.post('/register', registerValidator, register) 
api.post('/assignRole', validateJwt, isAdmin, assignRole); 
api.post('/login', loginValidator, login)
api.get('/getUsers', validateJwt, isAdmin, getUsers);

export default api
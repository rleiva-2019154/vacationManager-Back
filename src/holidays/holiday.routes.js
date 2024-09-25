import { Router } from "express";
import { validateJwt } from "../../middlewares/validate_Jwt.js";
import { isAdmin } from "../../middlewares/role-auth.js";
import { addHolidayValidator } from "../../middlewares/check-validators.js";
import { 
    addHoliday, 
    getHolidays, 
    deleteHoliday, 
    updateHoliday 
} from "./holiday.controller.js";

const api = Router();

// Rutas protegidas por JWT y rol de administrador
api.post('/addHoliday', validateJwt, isAdmin, addHolidayValidator, addHoliday);
api.get('/getHolidays', validateJwt, isAdmin, getHolidays);
api.delete('/deleteHoliday/:id', validateJwt, isAdmin, deleteHoliday);
api.put('/updateHoliday/:id', validateJwt, isAdmin, updateHoliday);

export default api;

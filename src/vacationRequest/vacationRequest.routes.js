import { Router } from "express";
import { validateJwt } from "../../middlewares/validate_Jwt.js";
import {
    addVacations
} from "./vacationRequest.controller.js"
import { isBoss, isEmployee } from "../../middlewares/role-auth.js";
import { addVacationRequestValidator } from "../../middlewares/check-validators.js";

const api = Router()

api.post('/addVacations', validateJwt, isEmployee, isBoss, addVacationRequestValidator, addVacations)

export default api
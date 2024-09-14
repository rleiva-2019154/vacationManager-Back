import { Router } from "express";
import { validateJwt } from "../../middlewares/validate_Jwt.js";
import {
    addVacations,
    approveVacation
} from "./vacationRequest.controller.js"
import { isAdmin, isBoss, isEmployee, isBossOrEmployee } from "../../middlewares/role-auth.js";
import { addVacationRequestValidator } from "../../middlewares/check-validators.js";

const api = Router()

api.post('/addVacations', validateJwt, isBossOrEmployee, addVacationRequestValidator, addVacations)

api.put('/approveVacationBoss/:requestId', validateJwt, isAdmin, approveVacation);

api.put('/approveVacationEmployee/:requestId', validateJwt, isBoss, approveVacation);

export default api
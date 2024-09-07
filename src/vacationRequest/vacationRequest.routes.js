import { Router } from "express";
import {
    addVacations
} from "./vacationRequest.controller.js"
import { addVacationRequestValidator } from "../../middlewares/check-validators.js";

const api = Router()

api.post('/addVacations', addVacationRequestValidator, addVacations)

export default api
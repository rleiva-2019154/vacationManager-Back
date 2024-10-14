import { Router } from "express";
import { validateJwt } from "../../middlewares/validate_Jwt.js";
import {
    addVacations,
    approveVacation,
    refuseVacation,
    getAvailableVacationDays,
    getUserVacationRequests,
    getVacationRequestStatus,
    getBossVacationRequests,
    getPendingRequests, 
    getApprovedRequests, 
    getRefusedRequests
} from "./vacationRequest.controller.js"
import { isAdmin, isBoss, isEmployee, isBossOrEmployee } from "../../middlewares/role-auth.js";
import { addVacationRequestValidator } from "../../middlewares/check-validators.js";

const api = Router()

api.post('/addVacations', validateJwt, isBossOrEmployee, addVacationRequestValidator, addVacations)

api.put('/approveVacationBoss/:requestId', validateJwt, isAdmin, approveVacation);

api.put('/approveVacationEmployee/:requestId', validateJwt, isBoss, approveVacation);

api.put('/refuseVacationBoss/:requestId', validateJwt, isAdmin, refuseVacation)

api.put('/refuseVacationEmployee/:requestId', validateJwt, isBoss, refuseVacation)

api.get('/getDays/:uid', validateJwt, isBossOrEmployee, getAvailableVacationDays);

api.get('/getUserVacationRequests/:uid', validateJwt, isBossOrEmployee, getUserVacationRequests)

api. get('/getVacationRequestStatus/:uid/:requestId', validateJwt, isBossOrEmployee, getVacationRequestStatus)

api.get('/getBossVacationRequests', validateJwt, isAdmin, getBossVacationRequests);

api.get('/getPendingRequests', validateJwt, isBossOrEmployee, getPendingRequests);

api.get('/getApprovedRequests', validateJwt, isBossOrEmployee, getApprovedRequests);

api.get('/getRefusedRequests', validateJwt, isBossOrEmployee, getRefusedRequests);

export default api
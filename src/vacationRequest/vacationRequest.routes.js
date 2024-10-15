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
    getEmployeeVacationRequests,
    getPendingRequests, 
    getApprovedRequests, 
    getRefusedRequests,
    getVacationDaysAviable,
    getApprovedBossRequests,
    getRefuseBossRequests,
    getPendingBossRequests 
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

api.get('/getEmployeeVacationRequests', validateJwt, isBoss, getEmployeeVacationRequests);

api.get('/getPendingRequests/:uid', validateJwt, isBossOrEmployee, getPendingRequests);

api.get('/getApprovedRequests/:uid', validateJwt, isBossOrEmployee, getApprovedRequests);

api.get('/getRefusedRequests/:uid', validateJwt, isBossOrEmployee, getRefusedRequests);

api.get('/getVacationDaysAviable/:uid', validateJwt, isBossOrEmployee, getVacationDaysAviable);

api.get('/getApprovedBossRequests', validateJwt, isAdmin, getApprovedBossRequests);

api.get('/getRefuseBossRequests', validateJwt, isAdmin, getRefuseBossRequests);

api.get('/getPendingBossRequests', validateJwt, isAdmin, getPendingBossRequests)

export default api
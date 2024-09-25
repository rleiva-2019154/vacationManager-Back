import { Router } from "express";
import { validateJwt } from "../../middlewares/validate_Jwt.js";
import { 
    createTeam,
    addMemberToTeam,
    editTeam,
    editTeamBoss,
    removeMemberFromTeam,
    deleteTeam,
    getTeams,
    getTeamById,
    getTeamMembersWithVacationDays
} from "./team.controller.js"
import { isAdmin, isBoss, isBossOrEmployee, isAdminOrBoss} from "../../middlewares/role-auth.js";
import { 
    addTeamValidator, 
    editTeamValidator
} from "../../middlewares/check-validators.js";


const api = Router()

api.post('/createTeam', validateJwt, isAdmin, addTeamValidator, createTeam)

api.put('/addMemberToTeam/:teamId', validateJwt, isAdminOrBoss, addMemberToTeam)

api.put('/editTeam/:teamId', validateJwt, isAdminOrBoss, editTeamValidator, editTeam)

api.put('/editTeamBoss/:teamId', validateJwt, isBoss, editTeamBoss)

api.delete('/removeMemberFromTeam/:teamId', validateJwt, isAdminOrBoss, removeMemberFromTeam)

api.delete('/deleteTeam/:teamId', validateJwt, isAdmin,deleteTeam)

api.get('/getTeams', validateJwt, isAdmin, getTeams)

api.get('/getTeamById/:teamId', validateJwt, isAdmin, getTeamById)

api.get('/getTeamMembersWithVacationDays/:teamId', getTeamMembersWithVacationDays)

export default api


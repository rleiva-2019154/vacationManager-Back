import mongoose from "mongoose";
import vacationRequestModel from "./vacationRequest.model.js";
import User from "../users/user.model.js";
import Holiday from "../holidays/holiday.model.js"

export const addVacations = async (req, res) => {
    try {
        const { uid, startTime, endTime, comments } = req.body;

        // Verificar si el usuario existe
        const user = await User.findById(uid);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Convertir las fechas a objetos de tipo Date
        const start = new Date(startTime);
        const end = new Date(endTime);

        // Verificar que la fecha de inicio sea anterior o igual a la fecha de fin
        if (end < start) {
            return res.status(400).json({ message: 'La fecha de fin debe ser posterior o igual a la fecha de inicio' });
        }

        // Calcular el número de días solicitados, excluyendo fines de semana
        let daysRequested = 0;
        let currentDate = new Date(start);

        // Recorrer todos los días desde la fecha de inicio hasta la fecha de fin (incluidos ambos extremos)
        while (currentDate <= end) {
            const dayOfWeek = currentDate.getDay();  // Obtener el día de la semana (0 = Domingo, 6 = Sábado)
            
            // Solo contar días laborables (de lunes a viernes)
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                daysRequested++;
            }

            // Avanzar al siguiente día
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Obtener los días festivos dentro del rango de fechas solicitadas
        const holidays = await Holiday.find({
            date: {
                $gte: start,
                $lte: end
            }
        });

        // Restar los días festivos del total de días solicitados
        const holidayCount = holidays.length;
        daysRequested -= holidayCount;  // Restar la cantidad de días festivos encontrados

        // Incluir el último día manualmente si cae en día laborable
        const lastDayOfWeek = end.getDay();
        if (lastDayOfWeek !== 0 && lastDayOfWeek !== 6 && !holidays.some(holiday => holiday.date.getTime() === end.getTime())) {
            daysRequested++;  // Sumar 1 si el último día es un día laborable
        }

        // Verificar si el usuario tiene suficientes días de vacaciones disponibles
        if (user.vacationDaysAvailable < daysRequested) {
            return res.status(400).json({ 
                message: `El usuario no tiene suficientes días de vacaciones disponibles. Días solicitados: ${daysRequested}, días disponibles: ${user.vacationDaysAvailable}`
            });
        }

        // Crear nueva solicitud de vacaciones
        const vacationRequest = new vacationRequestModel({
            uid: user._id,
            startTime: start,
            endTime: end,
            totalDaysRequested: daysRequested,  // Asignar los días calculados (excluyendo festivos y fines de semana)
            comments: comments || '',
            status: 'Pendiente'  // El estado inicial es 'Pendiente'
        });

        await vacationRequest.save();

        return res.status(201).json({
            message: `Solicitud de vacaciones creada correctamente. ${holidayCount > 0 ? `Se excluyeron ${holidayCount} días festivos.` : ''} A la espera de aprobación.`,
            vacationRequest
        });
    } catch (err) {
        console.error('Error al registrar la solicitud', err);
        return res.status(500).send({ message: 'No se pudo registrar su solicitud de vacaciones, intenta de nuevo más tarde', err });
    }
};

export const approveVacation = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { approvalComments } = req.body; // Comentarios opcionales de aprobación
        const { user } = req;  // El usuario que está intentando aprobar la solicitud

        // Buscar la solicitud de vacaciones por ID
        const vacationRequest = await vacationRequestModel.findById(requestId);
        if (!vacationRequest) {
            return res.status(404).json({ message: 'Solicitud de vacaciones no encontrada' });
        }

        // Verificar si la solicitud ya está aprobada
        if (vacationRequest.status === 'Aprobado' || vacationRequest.status === 'Rechazado') {
            return res.status(400).json({ message: 'Esta solicitud ya ha sido aprobada o rechazada.' });
        }

        // Buscar al usuario asociado con la solicitud de vacaciones
        const requestingUser = await User.findById(vacationRequest.uid);
        if (!requestingUser) {
            return res.status(404).json({ message: 'Usuario que solicitó las vacaciones no encontrado' });
        }

        // Verificar roles y restricciones
        if (user.role === 'BOSS' && requestingUser.role !== 'EMPLOYEE') {
            // Un BOSS solo puede aprobar las solicitudes de empleados
            return res.status(403).json({ message: 'Un BOSS solo puede aprobar solicitudes de EMPLOYEES.' });
        }

        if (user.role === 'BOSS' && user._id.equals(requestingUser._id)) {
            // Un BOSS no puede aprobar sus propias vacaciones
            return res.status(403).json({ message: 'Un BOSS no puede aprobar sus propias vacaciones.' });
        }

        // Verificar si el usuario tiene suficientes días disponibles
        if (requestingUser.vacationDaysAvailable < vacationRequest.totalDaysRequested) {
            return res.status(400).json({ message: 'El usuario no tiene suficientes días de vacaciones disponibles.' });
        }

        // Restar los días de vacaciones solicitados
        requestingUser.vacationDaysAvailable -= vacationRequest.totalDaysRequested;

        // Guardar los cambios en el usuario
        await requestingUser.save();

        // Actualizar el estado de la solicitud a 'Aprobado'
        vacationRequest.status = 'Aprobado';

        // Agregar comentarios de aprobación si existen
        if (approvalComments) {
            vacationRequest.comments = vacationRequest.comments + `${approvalComments}`;
        }

        // Guardar la solicitud de vacaciones actualizada
        await vacationRequest.save();

        return res.status(200).json({ 
            message: 'Solicitud de vacaciones aprobada correctamente y días restados al usuario.',
            vacationRequest
        });
    } catch (err) {
        console.error('Error al aprobar la solicitud de vacaciones', err);
        return res.status(500).send({ message: 'No se pudo aprobar la solicitud de vacaciones, intenta de nuevo más tarde', err });
    }
};

export const refuseVacation = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { rejectedComments } = req.body; // Comentarios opcionales sobre el rechazo
        const { user } = req;  // Usuario que está intentando rechazar la solicitud

        // Buscar la solicitud de vacaciones por ID
        const vacationRequest = await vacationRequestModel.findById(requestId);
        if (!vacationRequest) {
            return res.status(404).json({ message: 'Solicitud de vacaciones no encontrada' });
        }

        // Verificar si la solicitud ya está aprobada o rechazada
        if (vacationRequest.status === 'Aprobado' || vacationRequest.status === 'Rechazado') {
            return res.status(400).json({ message: 'Esta solicitud ya ha sido aprobada o rechazada.' });
        }

        // Buscar al usuario asociado con la solicitud de vacaciones
        const requestingUser = await User.findById(vacationRequest.uid);
        if (!requestingUser) {
            return res.status(404).json({ message: 'Usuario que solicitó las vacaciones no encontrado' });
        }

        // Verificar roles y restricciones
        if (user.role === 'BOSS' && requestingUser.role !== 'EMPLOYEE') {
            // Un BOSS solo puede rechazar las solicitudes de empleados
            return res.status(403).json({ message: 'Un BOSS solo puede rechazar solicitudes de EMPLOYEES.' });
        }

        if (user.role === 'BOSS' && user._id.equals(requestingUser._id)) {
            // Un BOSS no puede rechazar sus propias vacaciones
            return res.status(403).json({ message: 'Un BOSS no puede rechazar sus propias vacaciones.' });
        }

        // Agregar comentarios de rechazo si existen
        if (rejectedComments) {
            vacationRequest.comments = vacationRequest.comments ? `${vacationRequest.comments} ${rejectedComments}` : rejectedComments;
        }

        // Actualizar el estado de la solicitud a 'Rechazado'
        vacationRequest.status = 'Rechazado';

        // Guardar la solicitud de vacaciones actualizada
        await vacationRequest.save();

        return res.status(200).json({ 
            message: 'Solicitud de vacaciones rechazada correctamente.',
            vacationRequest
        });
    } catch (err) {
        console.error('Error al rechazar la solicitud de vacaciones', err);
        return res.status(500).send({ message: 'No se pudo rechazar la solicitud de vacaciones, intenta de nuevo más tarde', err });
    }
}

export const getAvailableVacationDays = async (req, res) => {
    try {
        const { uid } = req.params;  // El ID del usuario que se pasa por la URL

        // Buscar al usuario por su ID
        const user = await User.findById(uid);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Retornar los días de vacaciones disponibles del usuario
        return res.status(200).json({
            message: `Hola ${user.name} tienes ${user.vacationDaysAvailable} días de vacaciones disponibles.`,
            vacationDaysAvailable: user.vacationDaysAvailable
        });
    } catch (err) {
        console.error('Error al obtener los días de vacaciones disponibles', err);
        return res.status(500).json({ message: 'No se pudo obtener los días de vacaciones disponibles, intenta de nuevo más tarde', err });
    }
};

export const getUserVacationRequests = async (req, res) => {
    try {
        const { uid } = req.params;  // Obtener el ID del usuario desde los parámetros de la URL

        // Verificar si el usuario existe
        const user = await User.findById(uid);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Buscar todas las solicitudes de vacaciones que pertenezcan a este usuario
        const vacationRequests = await vacationRequestModel.find({ uid: user._id });

        // Si no hay solicitudes, devolver un mensaje adecuado
        if (!vacationRequests.length) {
            return res.status(404).json({ message: 'No se encontraron solicitudes de vacaciones para este usuario.' });
        }

        // Devolver las solicitudes de vacaciones encontradas
        return res.status(200).json({
            message: 'Solicitudes de vacaciones obtenidas correctamente.',
            vacationRequests
        });
    } catch (err) {
        console.error('Error al obtener las solicitudes de vacaciones del usuario', err);
        return res.status(500).json({ message: 'Error al obtener las solicitudes de vacaciones del usuario', err });
    }
};

export const getVacationRequestStatus = async (req, res) => {
    try {
        const { uid, requestId } = req.params;  // Obtener el ID del usuario y el ID de la solicitud desde los parámetros

        // Verificar si el usuario existe
        const user = await User.findById(uid);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Buscar la solicitud de vacaciones por ID y UID
        const vacationRequest = await vacationRequestModel.findOne({ _id: requestId, uid: user._id });
        
        // Verificar si la solicitud existe
        if (!vacationRequest) {
            return res.status(404).json({ message: 'Solicitud de vacaciones no encontrada.' });
        }

        // Devolver el estado de la solicitud
        return res.status(200).json({
            message: 'Estado de la solicitud obtenido correctamente.',
            requestId: vacationRequest._id,
            status: vacationRequest.status,
            days: vacationRequest.totalDaysRequested
        });
    } catch (err) {
        console.error('Error al obtener el estado de la solicitud', err);
        return res.status(500).json({ message: 'Error al obtener el estado de la solicitud', err });
    }
};

export const getBossVacationRequests = async (req, res) => {
    try {
        // Obtenemos a los usuarios que son jefes
        const bosses = await User.find({ role: 'BOSS' });

        if (!bosses.length) {
            return res.status(404).json({ message: 'No se encontraron jefes con solicitudes.' });
        }

        // Obtenemos las solicitudes de vacaciones de los jefes
        const bossVacationRequests = await vacationRequestModel.find({
            uid: { $in: bosses.map(boss => boss._id) }
        }).populate('uid', 'name surname email');

        if (!bossVacationRequests.length) {
            return res.status(404).json({ message: 'No se encontraron solicitudes de vacaciones para los jefes.' });
        }

        return res.status(200).json({
            message: 'Solicitudes de vacaciones obtenidas correctamente.',
            vacationRequests: bossVacationRequests
        });
    } catch (err) {
        console.error('Error al obtener las solicitudes de vacaciones de los jefes', err);
        return res.status(500).json({ message: 'Error al obtener las solicitudes de vacaciones de los jefes', err });
    }
};

export const getPendingRequests = async (req, res) => {
    try {
        const { uid } = req.params;  // Obtener el ID del usuario desde los parámetros de la URL

        // Verificar si el usuario existe
        const user = await User.findById(uid);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Buscar solo las solicitudes 'Pendiente' de este usuario
        const requests = await vacationRequestModel.find({ uid: user._id, status: 'Pendiente' }).populate('uid', 'name email');

        if (!requests.length) {
            return res.status(404).json({ message: 'No hay solicitudes pendientes para este usuario.' });
        }

        return res.status(200).json({
            message: 'Solicitudes pendientes obtenidas correctamente.',
            requests
        });
    } catch (err) {
        console.error('Error al obtener las solicitudes pendientes', err);
        return res.status(500).json({ message: 'Error al obtener las solicitudes pendientes', err });
    }
};

export const getApprovedRequests = async (req, res) => {
    try {
        const { uid } = req.params;  // Obtener el ID del usuario desde los parámetros de la URL

        // Verificar si el usuario existe
        const user = await User.findById(uid);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Buscar solo las solicitudes 'Aprobado' de este usuario
        const requests = await vacationRequestModel.find({ uid: user._id, status: 'Aprobado' }).populate('uid', 'name email');

        if (!requests.length) {
            return res.status(404).json({ message: 'No hay solicitudes aprobadas para este usuario.' });
        }

        return res.status(200).json({
            message: 'Solicitudes aprobadas obtenidas correctamente.',
            requests
        });
    } catch (err) {
        console.error('Error al obtener las solicitudes aprobadas', err);
        return res.status(500).json({ message: 'Error al obtener las solicitudes aprobadas', err });
    }
};

export const getRefusedRequests = async (req, res) => {
    try {
        const { uid } = req.params;  // Obtener el ID del usuario desde los parámetros de la URL

        // Verificar si el usuario existe
        const user = await User.findById(uid);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Buscar solo las solicitudes 'Rechazado' de este usuario
        const requests = await vacationRequestModel.find({ uid: user._id, status: 'Rechazado' }).populate('uid', 'name email');

        if (!requests.length) {
            return res.status(404).json({ message: 'No hay solicitudes rechazadas para este usuario.' });
        }

        return res.status(200).json({
            message: 'Solicitudes rechazadas obtenidas correctamente.',
            requests
        });
    } catch (err) {
        console.error('Error al obtener las solicitudes rechazadas', err);
        return res.status(500).json({ message: 'Error al obtener las solicitudes rechazadas', err });
    }
};

export const getVacationDaysAviable = async (req, res) => {
    try {
        const { uid } = req.params; // Obtener el UID del usuario desde los parámetros

        // Verificar si el usuario existe
        const user = await User.findById(uid);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Obtener los días de vacaciones disponibles del usuario
        const vacationDaysAvailable = user.vacationDaysAvailable;

        // Devolver los días de vacaciones disponibles
        return res.status(200).json({
            message: 'Días de vacaciones disponibles obtenidos correctamente.',
            vacationDaysAvailable
        });
    } catch (err) {
        console.error('Error al obtener los días de vacaciones disponibles', err);
        return res.status(500).json({ message: 'Error al obtener los días de vacaciones disponibles', err });
    }
};

// Obtener todas las solicitudes aprobadas de los jefes (para el admin)
export const getApprovedBossRequests = async (req, res) => {
    try {
        // Obtener los usuarios que son jefes
        const bosses = await User.find({ role: 'BOSS' });

        if (!bosses.length) {
            return res.status(404).json({ message: 'No se encontraron jefes con solicitudes aprobadas.' });
        }

        // Obtener solo las solicitudes 'Aprobado' de los jefes
        const approvedRequests = await vacationRequestModel.find({
            uid: { $in: bosses.map(boss => boss._id) },
            status: 'Aprobado'
        }).populate('uid', 'name surname email');

        if (!approvedRequests.length) {
            return res.status(404).json({ message: 'No se encontraron solicitudes aprobadas de los jefes.' });
        }

        return res.status(200).json({
            message: 'Solicitudes aprobadas obtenidas correctamente.',
            approvedRequests
        });
    } catch (err) {
        console.error('Error al obtener las solicitudes aprobadas de los jefes', err);
        return res.status(500).json({ message: 'Error al obtener las solicitudes aprobadas de los jefes', err });
    }
};

export const getRefuseBossRequests = async (req, res) => {
    try {
        // Obtener los usuarios que son jefes
        const bosses = await User.find({ role: 'BOSS' });

        if (!bosses.length) {
            return res.status(404).json({ message: 'No se encontraron jefes con solicitudes rechazadas.' });
        }

        // Obtener solo las solicitudes 'Rechazado' de los jefes
        const rejectedRequests = await vacationRequestModel.find({
            uid: { $in: bosses.map(boss => boss._id) },
            status: 'Rechazado'
        }).populate('uid', 'name surname email');

        if (!rejectedRequests.length) {
            return res.status(404).json({ message: 'No se encontraron solicitudes rechazadas de los jefes.' });
        }

        return res.status(200).json({
            message: 'Solicitudes rechazadas obtenidas correctamente.',
            requests: rejectedRequests // Asegúrate de que el nombre de la clave sea correcto
        });
    } catch (err) {
        console.error('Error al obtener las solicitudes rechazadas de los jefes', err);
        return res.status(500).json({ message: 'Error al obtener las solicitudes rechazadas de los jefes', err });
    }
};

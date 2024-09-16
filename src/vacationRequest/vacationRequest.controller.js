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

        // Verificar que la fecha de inicio sea anterior a la fecha de fin
        if (end < start) {
            return res.status(400).json({ message: 'La fecha de fin debe ser posterior a la fecha de inicio' });
        }

        // Calcular el número de días solicitados de manera inclusiva (contando ambos extremos)
        const timeDiff = Math.abs(end.getTime() - start.getTime());
        let daysRequested = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;  // Sumar 1 para incluir el día de inicio y fin

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

        // Crear nueva solicitud de vacaciones
        const vacationRequest = new vacationRequestModel({
            uid: user._id,
            startTime: start,
            endTime: end,
            totalDaysRequested: daysRequested,  // Asignar los días calculados (excluyendo festivos)
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
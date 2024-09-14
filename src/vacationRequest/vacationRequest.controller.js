import mongoose from "mongoose";
import vacationRequestModel from "./vacationRequest.model.js";
import User from "../users/user.model.js";

export const addVacations = async (req, res) => {
    try {
        const { uid, startTime, endTime, comments } = req.body;

        // Verificar si el usuario existe
        const user = await User.findById(uid);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Crear nueva solicitud de vacaciones (sin restar días)
        const vacationRequest = new vacationRequestModel({
            uid: user._id,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            comments: comments || '',
            status: 'Pendiente' // El estado inicial es 'Pendiente'
        });

        await vacationRequest.save();

        return res.status(201).json({
            message: 'Solicitud de vacaciones creada correctamente. A la espera de aprobación.',
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
        if (vacationRequest.status === 'Aprobado') {
            return res.status(400).json({ message: 'Esta solicitud ya ha sido aprobada.' });
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

        // Calcular el número de días solicitados
        const startTime = new Date(vacationRequest.startTime);
        const endTime = new Date(vacationRequest.endTime);
        const timeDiff = Math.abs(endTime.getTime() - startTime.getTime());
        const daysRequested = Math.ceil(timeDiff / (1000 * 3600 * 24));

        // Verificar si el usuario tiene suficientes días disponibles
        if (requestingUser.vacationDaysAvailable < daysRequested) {
            return res.status(400).json({ message: 'El usuario no tiene suficientes días de vacaciones disponibles.' });
        }

        // Restar los días de vacaciones solicitados
        requestingUser.vacationDaysAvailable -= daysRequested;

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
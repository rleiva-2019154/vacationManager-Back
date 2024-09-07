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

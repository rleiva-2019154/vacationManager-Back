// middleware/validateJwt.js
import jwt from 'jsonwebtoken';
import User from '../src/users/user.model.js';

export const validateJwt = async (req, res, next) => {
    try {
        // Obtener el token de los headers
        const { authorization } = req.headers;
        if (!authorization) {
            return res.status(401).send({ message: 'Unauthorized' });
        }

        // Verificar y decodificar el token
        const secretKey = process.env.SECRET_KEY;
        const { uid } = jwt.verify(authorization, secretKey);

        // Buscar al usuario por su ID (uid) decodificado
        const user = await User.findById(uid);
        if (!user) {
            return res.status(404).send({ message: 'User not found - Unauthorized' });
        }

        // Asignar el usuario a la solicitud (req)
        req.user = user;
        next();
    } catch (err) {
        console.error('Error in JWT validation', err);
        return res.status(401).send({ message: 'Invalid token' });
    }
};
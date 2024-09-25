'use strict'

export const isBoss = async(req, res, next) => {
    try {
        let { user } = req;
        if (!user || user.role !== 'BOSS') {
            return res.status(403).send({ message: `You don't have access | username: ${user.username}` });
        }
        next();
    } catch (err) {
        console.error(err);
        return res.status(403).send({ message: 'Unauthorized role' });
    }
};

export const isEmployee = async(req, res, next) => {
    try {
        let { user } = req;
        if (!user || user.role !== 'EMPLOYEE') {
            return res.status(403).send({ message: `You don´t have access | username: ${user.username}` });
        }
        next();
    } catch (err) {
        console.error(err);
        return res.status(403).send({ message: 'Unauthorized role' });
    }
};

export const isAdmin = async(req, res, next) => {
    try {
        let { user } = req;
        if (!user || user.role !== 'ADMIN') {
            return res.status(403).send({ message: `You don´t have access | username: ${user.username}` });
        }
        next();
    } catch (err) {
        console.error(err);
        return res.status(403).send({ message: 'Unauthorized role' });
    }
};

export const isBossOrEmployee = async (req, res, next) => {
    try {
        let { user } = req;

        if (!user || (user.role !== 'BOSS' && user.role !== 'EMPLOYEE')) {
            return res.status(403).send({ message: `You don’t have access | username: ${user ? user.username : 'unknown'}` });
        }

        next();
    } catch (err) {
        console.error(err);
        return res.status(403).send({ message: 'Unauthorized role' });
    }
};

export const isAdminOrBoss = async (req, res, next) => {
    try {
        const { user } = req;  // Asumiendo que el usuario está en `req.user` después de la autenticación

        // Verificar si el usuario existe y si su rol es ADMIN o BOSS
        if (!user || (user.role !== 'ADMIN' && user.role !== 'BOSS')) {
            return res.status(403).json({ message: `No tienes acceso. Rol actual: ${user ? user.role : 'Ninguno'}` });
        }

        // Si es ADMIN o BOSS, permitir que continúe
        next();
    } catch (error) {
        console.error('Error al validar el rol', error);
        return res.status(500).json({ message: 'Error al validar el rol', error });
    }
};
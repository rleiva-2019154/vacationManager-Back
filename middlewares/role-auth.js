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

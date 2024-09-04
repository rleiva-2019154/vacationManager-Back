import User from "../users/user.model.js";
import bcryptjs from 'bcryptjs';

// Función para crear un usuario BOSS por defecto
export const createDefaultBossUser = async () => {
    try {
        const bossExists = await User.findOne({ role: 'BOSS' });

        if (!bossExists) {
            const salt = await bcryptjs.genSalt();
            const hashedPassword = await bcryptjs.hash('defaultPassword123', salt);

            const defaultBoss = new User({
                name: 'Boss',
                surname: 'Boss',
                username: 'boss',
                email: 'boss@example.com',
                password: hashedPassword,
                role: 'BOSS',
                vacationDaysAvailable: 15
            });

            await defaultBoss.save();
            console.log('Usuario BOSS por defecto creado exitosamente.');
        } else {
            console.log('Usuario BOSS ya existe.');
        }
    } catch (err) {
        console.error('Error al crear el usuario BOSS por defecto', err);
    }
};

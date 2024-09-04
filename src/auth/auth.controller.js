import { generateJwt } from "../../utils/generate-jwt.js";
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

// Función de registro (declarativa)
export const register = async (req, res) => {
    try {
        const data = req.body;

        // Asegura que el rol sea siempre 'EMPLOYEE'
        data.role = 'EMPLOYEE';

        const salt = await bcryptjs.genSalt();
        data.password = await bcryptjs.hash(data.password, salt);
        
        const user = new User(data);
        await user.save();

        return res.send({
            message: `Usuario agregado a la base de datos correctamente, inicia sesión con el correo ${user.email}`,
            userDetails: {
                user: user.username,
                email: user.email
            }
        });
    } catch (err) {
        console.error('Error al registrar usuario', err);
        return res.status(500).send({ message: 'No se pudo registrar al usuario, intenta de nuevo más tarde', err });
    }
};

// Función de inicio de sesión
export const login = async (req, res) => {
    const { username, email, password } = req.body;
    const lowerEmail = email ? email.toLowerCase() : null;
    const lowerUsername = username ? username.toLowerCase() : null;
    try {
        const userExist = await User.findOne({
            $or: [
                { username: lowerUsername },
                { email: lowerEmail }
            ]
        });
        if (!userExist) {
            return res.status(404).json({
                msg: 'Credenciales inválidas',
                error: 'Aún no tienes cuenta con nosotros'
            });
        }
        const checkPassword = await bcryptjs.compare(password, userExist.password);
        if (!checkPassword) {
            return res.status(403).json({
                msg: 'Credenciales inválidas',
                error: 'Contraseña incorrecta'
            });
        }

        const token = await generateJwt({ uid: userExist._id, email: userExist.email });
        return res.json({
            msg: 'Inicio de sesión exitoso',
            userDetails: {
                username: userExist.username,
                email,
                role: userExist.role,
                token,
                uid: userExist._id
            }
        });
    } catch (err) {
        console.error('Error al iniciar sesión', err);
        return res.status(500).send({ message: 'Error al iniciar sesión, intenta de nuevo más tarde', err });
    }
};

import { generateJwt } from "../../utils/generate-jwt.js";
import User from "../users/user.model.js";
import bcryptjs from 'bcryptjs';

// Función para crear un usuario BOSS por defecto
export const createDefaultAdminUser = async () => {
    try {
        const AdminExists = await User.findOne({ role: 'ADMIN' });

        if (!AdminExists) {
            const salt = await bcryptjs.genSalt();
            const hashedPassword = await bcryptjs.hash('defaultPassword123', salt);

            const defaultAdmin = new User({
                name: 'Admin',
                surname: 'Admin',
                dpi: 3635003830101,
                username: 'admin',
                email: 'admin@example.com',
                password: hashedPassword,
                role: 'ADMIN',
                vacationDaysAvailable: 15
            });

            await defaultAdmin.save();
            console.log('Usuario ADMIN por defecto creado exitosamente.');
        } else {
            console.log('Usuario ADMIN ya existe.');
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
        data.role = 'UNASSIGNED';

        const salt = await bcryptjs.genSalt();
        data.password = await bcryptjs.hash(data.password, salt);
        
        const user = new User(data);
        await user.save();

        return res.send({
            message: `Usuario agregado a la base de datos correctamente, para iniciar sesion espera a que te asignen un rol.`,
            userDetails: {
                user: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Error al registrar usuario', err);
        return res.status(500).send({ message: 'No se pudo registrar al usuario, intenta de nuevo más tarde', err });
    }
};

export const assignRole = async (req, res) => {
    const { userId, role } = req.body;

    // Verificar que el rol sea válido ('BOSS' o 'EMPLOYEE')
    const validRoles = ['BOSS', 'EMPLOYEE'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({
            msg: 'Rol inválido. Los roles válidos son BOSS o EMPLOYEE.'
        });
    }

    try {
        // Buscar al usuario por ID
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                msg: 'Usuario no encontrado.'
            });
        }

        // Verificar si ya tiene el rol asignado
        if (user.role === role) {
            return res.status(400).json({
                msg: `El usuario ya tiene el rol ${role}.`
            });
        }

        // Asignar el nuevo rol
        user.role = role;
        await user.save();

        return res.json({
            msg: `Rol de usuario actualizado a ${role} exitosamente.`,
            userDetails: {
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Error al asignar rol', err);
        return res.status(500).send({ message: 'Error al asignar rol, intenta de nuevo más tarde', err });
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

export const getUsers = async (req, res) => {
    try {
        const users = await User.find({}, 'name surname email role');

        return res.json({
            msg: 'Usuarios obtenidos correctamente',
            users: users
        });
    } catch (err) {
        console.error('Error al obtener los usuarios', err);
        return res.status(500).json({ msg: 'Error al obtener los usuarios', error: err.message });
    }
};


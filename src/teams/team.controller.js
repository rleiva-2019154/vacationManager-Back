import mongoose from 'mongoose';
import Team from './team.model.js';
import User from '../users/user.model.js';

export const createTeam = async (req, res) => {
    try {
        const { name, members, boss, project } = req.body;

        // Crear el nuevo equipo
        const team = new Team({
            name,
            members,  // Directamente el arreglo de ObjectIds
            boss,  // ObjectId del jefe
            project
        });

        // Guardar el equipo en la base de datos
        await team.save();

        return res.status(201).json({
            message: 'Equipo creado correctamente',
            team
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error al crear el equipo', error });
    }
};

export const addMemberToTeam = async (req, res) => {
    try {
        const { userIds } = req.body;
        const { teamId } = req.params;

        // Verificar si el teamId es válido
        if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
            return res.status(400).json({ message: 'ID del equipo inválido' });
        }

        // Verificar que userIds sea un array y que todos los IDs sean válidos
        if (!userIds || !Array.isArray(userIds) || !userIds.every(id => mongoose.Types.ObjectId.isValid(id))) {
            return res.status(400).json({ message: 'IDs de usuarios inválidos o formato incorrecto' });
        }

        // Buscar el equipo por ID
        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json({ message: 'Equipo no encontrado' });
        }

        // Verificar si los usuarios existen y no están ya en el equipo
        const validUsers = await User.find({ _id: { $in: userIds } });
        if (validUsers.length !== userIds.length) {
            return res.status(404).json({ message: 'Uno o más usuarios no encontrados' });
        }

        const alreadyMembers = team.members.filter(memberId => userIds.includes(memberId.toString()));
        if (alreadyMembers.length > 0) {
            return res.status(400).json({ 
                message: `Algunos usuarios ya son miembros del equipo: ${alreadyMembers.join(', ')}` 
            });
        }

        // Agregar los nuevos miembros
        team.members.push(...userIds);
        await team.save();

        // Popular los miembros para mostrar nombre y email en lugar de ID
        const populatedTeam = await Team.findById(teamId).populate('members', 'name email');

        return res.status(200).json({ 
            message: 'Usuarios agregados al equipo correctamente', 
            team: populatedTeam 
        });
    } catch (error) {
        console.error('Error al agregar usuarios al equipo', error);
        return res.status(500).json({ message: 'Error al agregar usuarios al equipo', error });
    }
};


export const editTeam = async (req, res) => {
    try {
        const { teamId } = req.params;  // Obtener el ID del equipo desde los parámetros de la URL
        const { name, description, project } = req.body;  // Solo permitimos name, description, y project

        // Verificar si el teamId es válido
        if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
            return res.status(400).json({ message: 'ID del equipo inválido' });
        }

        // Buscar el equipo por ID
        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json({ message: 'Equipo no encontrado' });
        }

        // Si se envía un nombre, actualízalo
        if (name) {
            team.name = name;
        }

        // Si se envía una descripción, actualízala
        if (description) {
            team.description = description;
        }

        // Si se envía un proyecto, actualízalo
        if (project) {
            team.project = project;
        }

        // Guardar los cambios
        await team.save();

        // Popular los miembros y jefe para la respuesta
        const populatedTeam = await Team.findById(teamId)
            .populate('boss', 'name email')
            .populate('members', 'name email');

        return res.status(200).json({
            message: 'Equipo actualizado correctamente',
            team: populatedTeam
        });
    } catch (error) {
        console.error('Error al actualizar el equipo', error);
        return res.status(500).json({ message: 'Error al actualizar el equipo', error });
    }
};

export const editTeamBoss = async (req, res) => {
    try {
        const { teamId } = req.params;  // Obtener el ID del equipo desde los parámetros de la URL
        const { boss } = req.body;  // Solo permitimos cambiar el campo boss

        // Verificar si el teamId es válido
        if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
            return res.status(400).json({ message: 'ID del equipo inválido' });
        }

        // Verificar si el boss es un ObjectId válido
        if (!boss || !mongoose.Types.ObjectId.isValid(boss)) {
            return res.status(400).json({ message: 'ID del jefe inválido' });
        }

        // Buscar el nuevo jefe en la base de datos
        const bossUser = await User.findById(boss);
        if (!bossUser) {
            return res.status(404).json({ message: 'Jefe no encontrado' });
        }

        // Buscar el equipo por ID
        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json({ message: 'Equipo no encontrado' });
        }

        // Actualizar el jefe
        team.boss = boss;
        await team.save();

        // Popular el nuevo jefe y los miembros para la respuesta
        const populatedTeam = await Team.findById(teamId)
            .populate('boss', 'name email')
            .populate('members', 'name email');

        return res.status(200).json({
            message: 'Jefe del equipo actualizado correctamente',
            team: populatedTeam
        });
    } catch (error) {
        console.error('Error al actualizar el jefe del equipo', error);
        return res.status(500).json({ message: 'Error al actualizar el jefe del equipo', error });
    }
};

export const removeMemberFromTeam = async (req, res) => {
    try {
        const { teamId } = req.params;  // Obtener el ID del equipo desde los parámetros de la URL
        const { userId } = req.body;  // Obtener el ID del usuario que se va a eliminar

        // Verificar si el teamId es válido
        if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
            return res.status(400).json({ message: 'ID del equipo inválido' });
        }

        // Verificar si el userId es válido
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'ID del usuario inválido' });
        }

        // Buscar el equipo por ID
        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json({ message: 'Equipo no encontrado' });
        }

        // Verificar si el usuario está en el equipo
        if (!team.members.includes(userId)) {
            return res.status(400).json({ message: 'El usuario no es miembro del equipo' });
        }

        // Eliminar al usuario del equipo
        team.members = team.members.filter(memberId => memberId.toString() !== userId);

        // Guardar el equipo actualizado
        await team.save();

        // Popular los miembros y jefe para la respuesta
        const populatedTeam = await Team.findById(teamId)
            .populate('boss', 'name email')
            .populate('members', 'name email');

        return res.status(200).json({
            message: 'Usuario eliminado del equipo correctamente',
            team: populatedTeam
        });
    } catch (error) {
        console.error('Error al eliminar usuario del equipo', error);
        return res.status(500).json({ message: 'Error al eliminar usuario del equipo', error });
    }
};

export const deleteTeam = async (req, res) => {
    try {
        const { teamId } = req.params;  // Obtener el ID del equipo desde los parámetros de la URL

        // Verificar si el teamId es válido
        if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
            return res.status(400).json({ message: 'ID del equipo inválido' });
        }

        // Buscar y eliminar el equipo por ID
        const team = await Team.findByIdAndDelete(teamId);

        // Verificar si el equipo fue encontrado y eliminado
        if (!team) {
            return res.status(404).json({ message: 'Equipo no encontrado' });
        }

        // Devolver un mensaje de éxito
        return res.status(200).json({
            message: 'Equipo eliminado correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar el equipo', error);
        return res.status(500).json({ message: 'Error al eliminar el equipo', error });
    }
};

export const getTeams = async (req, res) => {
    try {
        // Buscar todos los equipos en la base de datos
        const teams = await Team.find()
            .populate('boss', 'name email')  // Popular la información del jefe (name, email)
            .populate('members', 'name email');  // Popular la información de los miembros (name, email)

        // Verificar si hay equipos en la base de datos
        if (!teams.length) {
            return res.status(404).json({ message: 'No hay equipos disponibles' });
        }

        // Devolver todos los equipos encontrados
        return res.status(200).json({
            message: 'Equipos obtenidos correctamente',
            teams
        });
    } catch (error) {
        console.error('Error al obtener los equipos', error);
        return res.status(500).json({ message: 'Error al obtener los equipos', error });
    }
};

export const getTeamById = async (req, res) => {
    try {
        const { teamId } = req.params;  // Obtener el ID del equipo desde los parámetros de la URL

        // Verificar si el teamId es válido
        if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
            return res.status(400).json({ message: 'ID del equipo inválido' });
        }

        // Buscar el equipo por ID y popular los miembros y jefe
        const team = await Team.findById(teamId)
            .populate('boss', 'name email')  // Popular la información del jefe (name, email)
            .populate('members', 'name email');  // Popular la información de los miembros (name, email)

        // Verificar si el equipo fue encontrado
        if (!team) {
            return res.status(404).json({ message: 'Equipo no encontrado' });
        }

        // Devolver el equipo encontrado
        return res.status(200).json({
            message: 'Equipo obtenido correctamente',
            team
        });
    } catch (error) {
        console.error('Error al obtener el equipo', error);
        return res.status(500).json({ message: 'Error al obtener el equipo', error });
    }
};

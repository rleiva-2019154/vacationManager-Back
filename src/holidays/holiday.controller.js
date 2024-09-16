import Holiday from "./holiday.model.js";

// Añadir un nuevo día festivo
export const addHoliday = async (req, res) => {
    try {
        const { date, name } = req.body;

        // Verificar si el día festivo ya existe
        const existingHoliday = await Holiday.findOne({ date: new Date(date) });
        if (existingHoliday) {
            return res.status(400).json({ message: 'Este día festivo ya existe.' });
        }

        const newHoliday = new Holiday({
            date: new Date(date),
            name
        });

        await newHoliday.save();
        return res.status(201).json({ message: 'Día festivo agregado correctamente.', newHoliday });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error al agregar el día festivo.', err });
    }
};

// Obtener todos los días festivos
export const getHolidays = async (req, res) => {
    try {
        const holidays = await Holiday.find();
        return res.status(200).json(holidays);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error al obtener los días festivos.', err });
    }
};

// Eliminar un día festivo por ID
export const deleteHoliday = async (req, res) => {
    try {
        const { id } = req.params;
        const holiday = await Holiday.findByIdAndDelete(id);
        if (!holiday) {
            return res.status(404).json({ message: 'Día festivo no encontrado.' });
        }
        return res.status(200).json({ message: 'Día festivo eliminado correctamente.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error al eliminar el día festivo.', err });
    }
};

// Actualizar un día festivo por ID
export const updateHoliday = async (req, res) => {
    try {
        const { id } = req.params;
        const { date, name } = req.body;

        const updatedHoliday = await Holiday.findByIdAndUpdate(
            id,
            { date: new Date(date), name },
            { new: true }
        );

        if (!updatedHoliday) {
            return res.status(404).json({ message: 'Día festivo no encontrado.' });
        }

        return res.status(200).json({ message: 'Día festivo actualizado correctamente.', updatedHoliday });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error al actualizar el día festivo.', err });
    }
};

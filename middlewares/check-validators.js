import { check } from "express-validator";
import { validationResult } from "express-validator"

const validateInput = (req, res, next)=>{
    const e = validationResult(req)
    if(!e.isEmpty()){
        return res.status(400).json(e)
    }
    next()
}

export const registerValidator = [
    check('name', "El nombre es obligatorio").not().isEmpty(),
    check('surname',"El apellido es obligatorio").not().isEmpty(),
    check('username',"El username es obligatorio").not().isEmpty(),
    check('email')
        .not().isEmpty().withMessage("El correo electronico es obligatorio")
        .isEmail().withMessage("El correo proporcionado no es valido"),
    check('password')
        .not().isEmpty().withMessage("La password es obligatoria")
        .isLength({ min: 6 }).withMessage("La password debe ser mayor a seis caracteres"),
    check('dpi')
        .not().isEmpty().withMessage("El DPI es obligatorio")
        .isNumeric().withMessage("El DPI debe contener solo números")
        .isLength({ min: 13, max: 13 }).withMessage("El DPI debe tener exactamente 13 caracteres"),
    validateInput
]

export const loginValidator = [
    check('username')
        .optional()  
        .notEmpty()
        .withMessage("El nombre de usuario no puede estar vacío"),
    check('email')
        .optional()  
        .notEmpty().withMessage("El correo electrónico no puede estar vacío")
        .isEmail().withMessage("El correo proporcionado no es válido"),
    check('password')
        .notEmpty().withMessage("La contraseña es obligatoria")
        .isLength({ min: 6 }).withMessage("La contraseña debe ser mayor a seis caracteres"),
    validateInput
];

export const addVacationRequestValidator = [
    check('uid', "El ID del usuario es obligatorio")
        .not().isEmpty()
        .isMongoId().withMessage("El ID del usuario debe ser un ObjectId válido"),
    
    check('startTime', "La fecha de inicio es obligatoria")
        .not().isEmpty()
        .isDate({ format: 'YYYY-MM-DD' }).withMessage("La fecha de inicio debe estar en un formato válido")
        .custom((value) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Eliminar la parte de la hora para comparar solo la fecha
            const startDate = new Date(value);

            if (startDate <= today) {
                throw new Error("La fecha de inicio debe ser posterior a la fecha actual");
            }
            return true;
        }),
    
    check('endTime', "La fecha de finalización es obligatoria")
        .not().isEmpty()
        .isDate({ format: 'YYYY-MM-DD' }).withMessage("La fecha de finalización debe estar en un formato válido")
        .custom((value, { req }) => {
            const startDate = new Date(req.body.startTime);
            const endDate = new Date(value);

            if (endDate <= startDate) {
                throw new Error("La fecha de finalización debe ser posterior a la fecha de inicio");
            }
            return true;
        }),
    check('totalDaysRequested')
        .optional(),
    check('comments')
        .optional()
        .isLength({ max: 500 }).withMessage("Los comentarios no pueden exceder los 500 caracteres"),
    
    validateInput
];

export const addHolidayValidator = [
    check('date', "La fecha de inicio es obligatoria")
    .not().isEmpty()
    .isDate({ format: 'YYYY-MM-DD' }).withMessage("La fecha de inicio debe estar en un formato válido"),
    check('name', "El nombre es obligatorio").not().isEmpty(),
]

export const updateHolidayValidator = [
    check('date', "No puedes mandar campos vacios")
    .not().isEmpty()
    .isDate({ format: 'YYYY-MM-DD' }).withMessage("La fecha de inicio debe estar en un formato válido"),
    check('name', "No puedes mandar campos vacios").not().isEmpty(),
]

export const addTeamValidator = [
    check('name', "El nombre del equipo es obligatorio")
        .not().isEmpty()
        .withMessage('El nombre del equipo no puede estar vacío'),
    check('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage("La descripción no puede exceder los 500 caracteres"),
    check('members')
        .optional()
        .isArray().withMessage('Los miembros deben ser un arreglo de IDs')
        .custom((value) => {
            if (!value.every(id => id.match(/^[0-9a-fA-F]{24}$/))) {
                throw new Error('Todos los IDs de los miembros deben ser ObjectIds válidos');
            }
            return true;
        }),
    check('boss', "El jefe del equipo es obligatorio")
        .not().isEmpty()
        .isMongoId()
        .withMessage('El jefe debe ser un ObjectId válido'),
    check('project')
        .optional()
        .isLength({ max: 200 })
        .withMessage("El nombre del proyecto no puede exceder los 200 caracteres"),
    validateInput
];

export const editTeamValidator = [
    check('name')
        .optional()  // El nombre es opcional al editar
        .notEmpty().withMessage('El nombre del equipo no puede estar vacío'),
    check('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage("La descripción no puede exceder los 500 caracteres"),
    check('project')
        .optional()
        .isLength({ max: 200 })
        .withMessage("El nombre del proyecto no puede exceder los 200 caracteres"),

    validateInput
];
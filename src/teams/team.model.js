import { Schema, model} from "mongoose";

// Definición del esquema de equipo
const teamSchema = new Schema(
    {
        name: {
            type: String,
            required: true,  
            unique: true,  
        },
        description: {
            type: String,
            default: ''  
        },
        members: {
            type: [Schema.Types.ObjectId],  // Arreglo de ObjectId referenciando a 'User'
            ref: 'User',
            required: true  // Los miembros son obligatorios
        },
        boss: {
            type: Schema.Types.ObjectId,  // El jefe es un ObjectId que referencia a 'User'
            ref: 'User',
            required: true  // El jefe es obligatorio
        },
        project: {
            type: String,  
            default: ''
        },
        createdAt: {
            type: Date,
            default: Date.now  
        }
    },
    { timestamps: true,
        versionKey: false 
    }
);

export default model('Team', teamSchema);

import { Schema, model } from "mongoose";

const holidaySchema = new Schema(
    {
        date: {
            type: Date,
            required: true,
            unique: true  // Evita duplicar días festivos
        },
        name: {
            type: String,
            required: true,  // Ejemplo: "Navidad", "Año Nuevo", etc.
        }
    },
    {
        versionKey: false
    }
);

export default model("Holiday", holidaySchema);

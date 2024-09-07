import {Schema, model } from "mongoose"

const vacationRequestSchema = Schema (
    {
        uid: {
            type: Schema.Types.ObjectId,
            ref: 'User', 
            required: true
        },
        startTime: {
            type: Date,
            required: true
        },
        endTime: {
            type: Date,
            required: true
        },
        status: {
            type: String,
            enum: ['Pendiente', 'Aprobado', 'Rechazado'],
            default: 'Pendiente'
        },
        comments: {
            type: String,
            maxLength: 500
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
)

export default model("VacationRequest", vacationRequestSchema);
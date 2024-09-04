import { Schema, model } from "mongoose"

const userSchema = Schema(
    {
        name: {
            type: String,
            maxLength: 30,
            required: true
        },
        surname: {
            type: String,
            required: true
        },
        username: {
            type: String,
            unique: true,
            required: true
        },
        email: {
            type: String,
            unique: true,
            required: true
        },
        password: {
            type: String,
            required: true
        },
        vacationDaysAvailable: {
            type: Number,
            default: 15
        },
        role: {
            type: String,
            enum: ['BOSS', 'EMPLOYEE'],
            required: true
        }
    },
    {
        versionKey: false
    }
)

export default model("User", userSchema)
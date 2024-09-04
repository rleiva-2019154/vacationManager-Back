import mongoose from 'mongoose';

export const dbConnection = async () => {
    try {
        mongoose.connection.on('error', () => {
            console.log('MongoDB | could not connect to the database');
            mongoose.disconnect(); 
        });
        mongoose.connection.on('connecting', () => {
            console.log('MongoDB | trying to connect');
        });
        mongoose.connection.on('connected', () => {
            console.log('MongoDB | connected to MongoDB');
        });
        mongoose.connection.on('open', () => {
            console.log('MongoDB | connected to the database');
        });
        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB | disconnected from MongoDB');
        });
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            maxPoolSize: 50
        });
    } catch (err) {
        console.error('Database connection failed', err);
    }
};

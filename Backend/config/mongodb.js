import mongoose from "mongoose";
import dns from 'node:dns'
import 'dotenv/config'

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI?.trim();
        const dbName = process.env.MONGODB_DB_NAME?.trim() || 'Ecommerce';

        if (!mongoUri) {
            throw new Error('MONGODB_URI is missing in Backend/.env')
        }

        try {
            await mongoose.connect(mongoUri, { dbName })
        } catch (error) {
            // Some local DNS resolvers refuse SRV lookups used by mongodb+srv.
            if (mongoUri.startsWith('mongodb+srv://') && String(error?.message || '').includes('querySrv ECONNREFUSED')) {
                dns.setServers(['8.8.8.8', '1.1.1.1'])
                await mongoose.connect(mongoUri, { dbName })
            } else {
                throw error
            }
        }
        console.log(`MongoDB connected: ${dbName}`);
    } catch (error) {
        console.log("MongoDB connection error:", error.message);
        process.exit(1);
    }
}

export default connectDB;

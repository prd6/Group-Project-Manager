import mongoose from "mongoose";
import OTP from "../models/OTP.js";

const syncOTPIndexes = async () => {
    try {
        await OTP.syncIndexes();

        const indexes = await OTP.collection.indexes();
        const ttlIndexes = indexes.filter(
            (index) => typeof index.expireAfterSeconds === "number"
        );
        const expectedTTLIndex = ttlIndexes.find(
            (index) =>
                index.key?.expiresAt === 1 &&
                index.expireAfterSeconds === 0
        );
        const staleTTLIndexes = ttlIndexes.filter(
            (index) =>
                !(
                    index.key?.expiresAt === 1 &&
                    index.expireAfterSeconds === 0
                )
        );

        if (!expectedTTLIndex) {
            console.warn(
                "[OTP] Expected TTL index on expiresAt is missing. Recreate it if OTP expiry behaves unexpectedly."
            );
        }

        if (staleTTLIndexes.length > 0) {
            console.warn("[OTP] Unexpected TTL indexes detected:", staleTTLIndexes);
        }
    } catch (error) {
        console.error("[OTP] Failed to sync OTP indexes:", error.message);
    }
};

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);

        console.log("MongoDB Connected Successfully");
        await syncOTPIndexes();
    } catch (error) {
        console.error("MongoDB Connection Failed");
        console.error(error.message);
        process.exit(1);
    }
};

export default connectDB;

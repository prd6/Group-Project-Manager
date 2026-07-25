import mongoose from "mongoose";

import OTP from "../models/OTP.js";
import { initGridFS } from "./gridfs.js";

const isProduction =
  process.env.NODE_ENV === "production";

// ==========================================
// OTP INDEX CHECK
// ==========================================

const checkOTPIndexes = async () => {
  try {
    /*
     * During development, keep MongoDB indexes
     * synchronized with the Mongoose schema.
     *
     * In production we only inspect them instead
     * of automatically modifying indexes.
     */
    if (!isProduction) {
      await OTP.syncIndexes();
    }

    const indexes =
      await OTP.collection.indexes();

    const ttlIndexes =
      indexes.filter(
        (index) =>
          typeof index.expireAfterSeconds ===
          "number"
      );

    const expectedTTLIndex =
      ttlIndexes.find(
        (index) =>
          index.key?.expiresAt === 1 &&
          index.expireAfterSeconds === 0
      );

    const staleTTLIndexes =
      ttlIndexes.filter(
        (index) =>
          !(
            index.key?.expiresAt === 1 &&
            index.expireAfterSeconds === 0
          )
      );

    if (!expectedTTLIndex) {
      console.warn(
        "[OTP] Expected TTL index on expiresAt is missing."
      );
    }

    if (staleTTLIndexes.length > 0) {
      console.warn(
        "[OTP] Unexpected TTL indexes detected:",
        staleTTLIndexes
      );
    }
  } catch (error) {
    /*
     * OTP index inspection should not take
     * the entire API offline.
     */
    console.error(
      "[OTP] Failed to check indexes:",
      error.message
    );
  }
};

// ==========================================
// DATABASE CONNECTION
// ==========================================

const connectDB = async () => {
  if (!process.env.MONGODB_URL) {
    throw new Error(
      "MONGODB_URL environment variable is missing"
    );
  }

  try {
    await mongoose.connect(
      process.env.MONGODB_URL,
      {
        serverSelectionTimeoutMS: 10000,
      }
    );

    console.log(
      "MongoDB connected successfully"
    );

    // GridFS requires an active MongoDB connection.
    initGridFS();

    await checkOTPIndexes();

    return mongoose.connection;
  } catch (error) {
    console.error(
      "MongoDB connection failed:",
      error.message
    );

    /*
     * Do NOT process.exit() here.
     *
     * Let server.js decide how startup
     * failures should be handled.
     */
    throw error;
  }
};

export default connectDB;
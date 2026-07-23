import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";

let gridFSBucket;

export const initGridFS = () => {
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("MongoDB connection not established.");
  }

  gridFSBucket = new GridFSBucket(db, {
    bucketName: "uploads",
  });

  console.log("✅ GridFS initialized");
};

export const getGridFSBucket = () => {
  if (!gridFSBucket) {
    throw new Error("GridFS not initialized.");
  }

  return gridFSBucket;
};
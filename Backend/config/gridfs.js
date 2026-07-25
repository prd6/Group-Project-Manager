import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";

let gridFSBucket = null;

// ==========================================
// INITIALIZE GRIDFS
// ==========================================

export const initGridFS = () => {
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error(
      "Cannot initialize GridFS: MongoDB is not connected."
    );
  }

  // Prevent unnecessary reinitialization.
  if (gridFSBucket) {
    return gridFSBucket;
  }

  gridFSBucket = new GridFSBucket(db, {
    bucketName: "uploads",
  });

  console.log("GridFS initialized");

  return gridFSBucket;
};

// ==========================================
// GET GRIDFS BUCKET
// ==========================================

export const getGridFSBucket = () => {
  if (!gridFSBucket) {
    throw new Error(
      "GridFS has not been initialized."
    );
  }

  return gridFSBucket;
};

// ==========================================
// RESET GRIDFS
// ==========================================

export const resetGridFS = () => {
  gridFSBucket = null;
};
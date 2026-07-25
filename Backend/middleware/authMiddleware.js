import jwt from "jsonwebtoken";
import User from "../models/User.js";

const authMiddleware = async (req, res, next) => {
  try {
    // ==========================================
    // SERVER CONFIG
    // ==========================================

    if (!process.env.JWT_KEY) {
      console.error(
        "JWT_KEY is not configured on the server."
      );

      return res.status(500).json({
        message: "Server configuration error",
      });
    }

    // ==========================================
    // AUTHORIZATION HEADER
    // ==========================================

    const authHeader =
      req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const [scheme, token] =
      authHeader.trim().split(/\s+/);

    if (
      scheme?.toLowerCase() !== "bearer" ||
      !token
    ) {
      return res.status(401).json({
        message: "Invalid authorization header",
      });
    }

    // ==========================================
    // VERIFY JWT
    // ==========================================

    const decoded = jwt.verify(
      token,
      process.env.JWT_KEY
    );

    if (!decoded?.id) {
      return res.status(401).json({
        message: "Invalid token payload",
      });
    }

    // ==========================================
    // CHECK CURRENT USER
    // ==========================================

    const user = await User.findById(
      decoded.id
    ).select(
      "_id role isBanned"
    );

    if (!user) {
      return res.status(401).json({
        message: "User account no longer exists",
      });
    }

    // ==========================================
    // BANNED ACCOUNT
    // ==========================================

    if (user.isBanned) {
      return res.status(403).json({
        message: "Your account has been banned.",
      });
    }

    // ==========================================
    // AUTHENTICATED USER
    // ==========================================

    /*
     * Don't trust the role stored in an old JWT.
     * Use the current role from MongoDB instead.
     */
    req.user = {
      id: user._id.toString(),
      role: user.role,
    };

    return next();
  } catch (error) {
    // ==========================================
    // EXPIRED JWT
    // ==========================================

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message:
          "Session expired. Please log in again.",
      });
    }

    // ==========================================
    // INVALID JWT
    // ==========================================

    if (
      error.name === "JsonWebTokenError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        message: "Invalid token",
      });
    }

    // Invalid/deleted MongoDB ObjectId in token
    if (error.name === "CastError") {
      return res.status(401).json({
        message: "Invalid token",
      });
    }

    console.error(
      "Authentication middleware error:",
      error
    );

    return res.status(500).json({
      message: "Authentication failed",
    });
  }
};

export default authMiddleware;
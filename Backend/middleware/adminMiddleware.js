const adminMiddleware = (
  req,
  res,
  next
) => {
  if (!req.user?.id) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin only.",
    });
  }

  return next();
};

export default adminMiddleware;
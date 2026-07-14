import { auditLog } from "./auditMiddleware.js";

export const authorizeOrderAccess = (req, res, next) => {
  const { orderId } = req.params;
  const user = req.user;

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (user.role === "admin") {
    return next();
  }

  const allowedOrderRoutes = ["/orders/queue", "/orders/history"];
  if (allowedOrderRoutes.includes(req.path)) {
    return next();
  }

  if (req.method === "GET" && req.path.includes("/orders/")) {
    if (orderId) {
      return next();
    }
  }

  if (req.method === "POST" && req.path.includes("/orders/")) {
    return next();
  }

  return res.status(403).json({ error: "Forbidden" });
};

export const authorizeOrderMutation = (req, res, next) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (user.role === "admin") {
    return next();
  }

  if (user.role === "staff") {
    auditLog("staff-order-mutation", { userId: user.id, orderId: req.params.orderId, route: req.originalUrl });
    return next();
  }

  return res.status(403).json({ error: "Forbidden" });
};

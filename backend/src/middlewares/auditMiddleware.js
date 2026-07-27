import fs from "fs";
import path from "path";

const auditLogDir = path.join(process.cwd(), "logs");
fs.mkdirSync(auditLogDir, { recursive: true });

const auditFile = path.join(auditLogDir, "audit.log");

export const auditLog = (action, details = {}) => {
  const entry = {
    timestamp: new Date().toISOString(),
    action,
    ...details
  };

  fs.appendFileSync(auditFile, `${JSON.stringify(entry)}\n`);
};

export const auditSensitiveAction = (req, res, next) => {
  const action = req.method + " " + req.originalUrl;
  const context = {
    ip: req.ip,
    userId: req.user?.id || null,
    role: req.user?.role || null,
    orderId: req.params.orderId || null
  };

  auditLog(action, context);

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    auditLog(`${action} -> success`, {
      ...context,
      responseStatus: res.statusCode || 200,
      responseBody: body
    });
    return originalJson(body);
  };

  const originalSend = res.send.bind(res);
  res.send = (body) => {
    auditLog(`${action} -> success`, {
      ...context,
      responseStatus: res.statusCode || 200,
      responseBody: body
    });
    return originalSend(body);
  };

  next();
};

import { HttpError } from "../utils/http.js";

export function notFoundHandler(req, res) {
  res.status(404).json({
    ok: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(error, _req, res, _next) {
  const statusCode = error instanceof HttpError ? error.statusCode : 500;
  const message = error.message || "Internal server error";

  if (statusCode >= 500) {
    console.error("[server:error]", error);
  }

  res.status(statusCode).json({
    ok: false,
    error: message,
  });
}

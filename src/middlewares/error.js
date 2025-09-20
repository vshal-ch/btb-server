/** Not-found handler */
export function notFound(_req, res, _next) {
  res.status(404).json({ success: false, error: "Route not found" });
}

/** Centralized error handler */
export function errorHandler(err, _req, res, _next) {
  console.error(err); // log once here; replace with winston in prod
  const status = err.status || 500;
  const payload = {
    success: false,
    error: err.message || "Internal Server Error",
    data: {},
  };
  if (process.env.NODE_ENV !== "production" && err.stack) {
    payload.stack = err.stack;
  }
  res.status(status).json(payload);
}

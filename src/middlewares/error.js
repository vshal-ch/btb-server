/** Not-found handler */
export function notFound(_req, res, _next) {
  res.status(404).json({ success: false, error: "Route not found" });
}

/** Centralized error handler */
export function errorHandler(err, _req, res, _next) {
  console.error(err); // log once here; replace with winston in prod
  let dbStatus, message;

  if (err.code && typeof err.code === "string" && err.code.length === 5) {
    const pgClass = err.code.substring(0, 2);

    switch (pgClass) {
      case "23":
        // Integrity constraint violation
        dbStatus = 400;
        message = "Data already exists or invalid request data";
        break;

      case "22":
        // Data exception (invalid input syntax, etc.)
        dbStatus = 400;
        message = "Invalid input format";
        break;

      case "42":
        // Syntax error or missing table/column
        dbStatus = 500;
        message = "Database configuration error";
        break;

      case "40":
        // Transaction rollback (deadlock etc.)
        dbStatus = 409;
        message = "Request conflict. Please try again.";
        break;

      case "28":
        // Invalid authorization
        dbStatus = 401;
        message = "Database authorization error";
        break;

      default:
        dbStatus = 500;
        message = "Database error";
    }
  } else {
    dbStatus = 500;
    message = err.message;
  }

  const respStatus = err.status || dbStatus;
  message = message || "Internal Server Error";
  const payload = {
    success: false,
    error: message,
    data: {},
  };
  if (process.env.NODE_ENV !== "production" && err.stack) {
    payload.stack = err.stack;
  }
  res.status(respStatus).json(payload);
}
